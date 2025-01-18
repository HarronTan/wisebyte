import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import Modal from "react-modal";
import { Pie } from "react-chartjs-2";
import { getTransactionWithinMonth } from "../db";
// Import Chart.js elements and plugins
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register the components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  ChartDataLabels
);

const Tab2 = () => {
  const [dateField, setDateField] = useState(new Date());
  const [isModalOpen, setModalOpen] = useState(false);
  const datetimeRef = useRef(null);
  const [chartData, setChartData] = useState<any | null>(null);

  useEffect(() => {
    getTransactionWithinMonth(dateField).then((recs) => {
      // Group and sum by category
      const totals: Record<string, number> = sortEntries(
        recs.reduce<Record<string, number>>((acc, { category, amount }) => {
          acc[category] = (acc[category] || 0) + amount;
          return acc;
        }, {})
      );
      // Calculate percentages
      const totalAmount = Object.values(totals).reduce((a, b) => a + b, 0);
      const percentages = Object.entries(totals).map(([category, amount]) => ({
        category,
        percentage: ((amount / totalAmount) * 100).toFixed(2),
      }));

      // Prepare chart data
      setChartData({
        labels: percentages.map((item) => item.category),
        datasets: [
          {
            label: "Expense Distribution",
            data: percentages.map((item) => parseFloat(item.percentage)),
            backgroundColor: [
              "#EB5858",
              "#EB7B58",
              "#EB9F58",
              "#EBCB58",
              "#EBE558",
              "#C5EB58",
            ],
            hoverOffset: 4,
          },
        ],
      });
    });
  });

  function sortEntries(totals: Record<string, number>) {
    // Convert the object to an array and sort it in descending order
    const sortedTotals = Object.entries(totals).sort((a, b) => b[1] - a[1]); // Sort by the second element (amount) in descending order

    // Optionally convert it back to an object (if you need an object, not an array)
    const sortedTotalsObject = Object.fromEntries(sortedTotals);
    return sortedTotalsObject;
  }

  // Function to handle date change via manual navigation (prev/next)
  const changeDate = (direction: string) => {
    const newDate = new Date(dateField);
    if (direction === "back") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setDateField(newDate);
  };

  // Function to handle modal date change event
  const changeDateEvent = (event: any) => {
    setDateField(new Date(event.target.value));
    setModalOpen(false);
  };

  // Function to open/close modal
  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  return (
    <div className="container-fluid page">
      <div className="content">
        <div className="row justify-content-center text-center py-3">
          <div className="col-12 col-md-6 d-flex justify-content-between align-items-center">
            {/* Previous Month Button */}
            <FaChevronLeft
              onClick={() => changeDate("back")}
              aria-label="backDate"
              color="rgb(24, 58, 85)"
            />

            {/* Date Selector Button */}
            <button
              style={{
                backgroundColor: "#D6F4FF",
                borderRadius: "30px",
                color: "#183A55",
                boxShadow: "2px 2px 10px 0px rgba(0,0,0,0.1)",
                border: "none",
                padding: "2% 5%",
                fontWeight: "600",
              }}
              onClick={toggleModal}
            >
              {dateField.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </button>

            {/* Next Month Button */}
            <FaChevronRight
              onClick={() => changeDate("forward")}
              aria-label="forwardDate"
              color="rgb(24, 58, 85)"
            />
          </div>
        </div>

        {/* Modal for Date Selection */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={toggleModal}
          contentLabel="Select Month and Year"
          className="modal-dialog-centered"
          ariaHideApp={false} // For accessibility (depending on app structure)
        >
          <div className="modal-content p-4">
            <input
              type="month"
              ref={datetimeRef}
              value={dateField.toISOString().substr(0, 7)} // yyyy-MM format
              onChange={changeDateEvent}
              className="form-control"
            />
            <div className="mt-3 d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={toggleModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => changeDateEvent({ target: datetimeRef.current })}
              >
                Select
              </button>
            </div>
          </div>
        </Modal>

        {/* Content below the date selector */}
        {chartData && (
          <div className="justify-content-center expenses-container">
            <div>
              <Pie
                data={chartData}
                options={{
                  maintainAspectRatio: true,
                  responsive: true,
                  animation: {
                    duration: 100,
                  },
                  plugins: {
                    tooltip: {
                      animation: { duration: 50, easing: "easeInOutQuart" }, // Disable tooltip animation
                    },
                    datalabels: {
                      color: "#D6F4FF", // Label color
                      font: {
                        size: 14,
                        weight: "bold",
                      },
                      formatter: (value, context: any) => {
                        const label =
                          context.chart.data.labels[context.dataIndex];
                        return label.charAt(0).toUpperCase() + label.slice(1); // Capitalize first letter
                      },
                      anchor: "end", // Position of label
                      align: "start", // Alignment of label
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab2;

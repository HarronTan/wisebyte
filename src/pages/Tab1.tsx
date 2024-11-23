import React, { useState, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Modal from "react-modal";
import TransactionContainer from "../components/TransactionContainer";
import "./tab1.css";

const Tab1 = () => {
  const [dateField, setDateField] = useState(new Date());
  const [isModalOpen, setModalOpen] = useState(false);
  const datetimeRef = useRef(null);

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
            />

            {/* Date Selector Button */}
            <button className="btn btn-primary" onClick={toggleModal}>
              {dateField.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </button>

            {/* Next Month Button */}
            <FaChevronRight
              onClick={() => changeDate("forward")}
              aria-label="forwardDate"
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
        <div className="row justify-content-center expenses-container">
          <TransactionContainer date={dateField} />
        </div>
      </div>
    </div>
  );
};

export default Tab1;

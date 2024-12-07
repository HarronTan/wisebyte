import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import "./transactionContainer.css";
import { IonIcon } from "@ionic/react";
import * as Icons from "ionicons/icons";
import db, {
  Categories,
  getTotalTransactionAmountByCategoryWithinMonth,
  getTransactionWithinMonth,
  Transactions,
  CategoryTotal,
} from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { useSwipeable } from "react-swipeable";
import { motion } from "framer-motion";

const TransactionContainer = ({ date }: { date: Date }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCat] = useState("");
  const [catColor, setColor] = useState("");
  const [ops, setOps] = useState("");
  const [input, setInput] = useState("");
  const [desc, setDesc] = useState("");
  const [displayRec, setDisplayRec] = useState<
    [string, Transactions[]][] | null
  >(null);
  const [dateField, setDateField] = useState<Date | null>(new Date());
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Transactions | null>(null);
  const [totalTransactionAmt, setTotalTransactionAmt] = useState("0");
  //new variable
  const [isCatOpen, setCatOpen] = useState(true);
  const [catAmount, setCatAmount] = useState<Record<string, CategoryTotal>>();
  const datePicker = useRef<any>();

  const categories: Categories[] | undefined = useLiveQuery(
    () => db.table("categories").toArray(), // Dexie query: fetch all users
    [] // Dependency array: live query always listens for changes, so no dependencies are required here
  );

  useEffect(() => {
    getTransactionWithinMonth(date).then((recs) => {
      const total = recs
        .reduce((prev, curr) => prev + curr.amount, 0)
        .toFixed(2);

      setTotalTransactionAmt(total);
      const displayRecs: Map<string, Transactions[]> = new Map();
      recs.forEach((rec) => {
        if (displayRecs.get(rec.date_time.toDateString()) == null) {
          displayRecs.set(rec.date_time.toDateString(), [rec]);
        } else {
          const existing = displayRecs.get(rec.date_time.toDateString());
          displayRecs.set(rec.date_time.toDateString(), [...existing!, rec]);
        }
      });
      setDisplayRec(Array.from(displayRecs));
    });
    getTotalTransactionAmountByCategoryWithinMonth(date).then((result) => {
      setCatAmount(result);
    });
  }, [date, isOpen, isEditModalOpen]);

  const handleButtonClick = async (value: any) => {
    if (value === "backsapce") {
      if (input.charAt(input.length - 1) === ops) {
        setOps("");
      }
      setInput(input.slice(0, -1));
      return;
    }

    if (value === "addMinus" && ops !== "") {
      if (
        input.charAt(input.length - 1) !== "+" &&
        input.charAt(input.length - 1) !== "-"
      ) {
        calculate(true, "+");
        return;
      }

      let operation = input.charAt(input.length - 1) === "+" ? "-" : "+";
      setInput(
        input.slice(0, input.indexOf(input.charAt(input.length - 1))) +
          operation
      );
      setOps(operation);
      return;
    } else if (value === "addMinus") {
      setOps("+");
      setInput(input + "+");
      return;
    }

    if (value === "mulDiv" && ops !== "") {
      if (
        input.charAt(input.length - 1) !== "x" &&
        input.charAt(input.length - 1) !== "÷"
      ) {
        calculate(true, "x");
        return;
      }

      let operation = input.charAt(input.length - 1) === "x" ? "÷" : "x";

      setInput(
        input.slice(0, input.indexOf(input.charAt(input.length - 1))) +
          operation
      );
      setOps(operation);
      return;
    } else if (value === "mulDiv") {
      setOps("x");
      setInput(input + "x");
      return;
    }

    if (value === "=") {
      calculate(false, "");
      return;
    }

    setInput(input + value);
  };

  const calculate = (reCal: any, value: any) => {
    const [a, b] = input.split(ops).map(Number);
    let total;
    switch (ops) {
      case "+":
        total = a + b;
        break;
      case "-":
        total = a - b;
        break;
      case "x":
        total = a * b;
        break;
      default:
        total = a / b;
    }

    if (!Number.isInteger(total)) total = total.toFixed(4);
    if (reCal) {
      setOps(value);
      setInput(total + value);
      return;
    }
    setOps("");
    setInput(total.toString());
  };

  const handleClear = () => {
    setInput("");
    setOps("");
  };

  const clearInputs = () => {
    setInput("");
    setCat("");
    setColor("");
    setDesc("");
  };

  const handleSubmit = async () => {
    const date_time = dateField ? dateField : new Date();
    if (editingRec != null) {
      editingRec.amount = Number(input);
      editingRec.category = category.toLowerCase();
      editingRec.desc = desc !== "" ? desc : category;
      const oldDate = new Date(editingRec.date_time);
      const newDate = new Date(date_time);
      newDate.setHours(oldDate.getHours());
      newDate.setMinutes(oldDate.getMinutes());
      newDate.setSeconds(oldDate.getSeconds());
      newDate.setMilliseconds(oldDate.getMilliseconds());
      editingRec.date_time = new Date(newDate);
      await db
        .table("transactions")
        .where({ id: editingRec.id })
        .modify((rec) => {
          rec.amount = Number(input);
          rec.category = category.toLowerCase();
          rec.desc = desc !== "" ? desc : category;
          rec.date_time = editingRec.date_time;
        });
      clearInputs();
      setIsOpen(false);
      return;
    }
    const newTransaction: Omit<Transactions, "id"> = {
      category: category.toLowerCase(),
      desc: desc !== "" ? desc : category,
      amount: Number(input),
      date_time: date_time,
    };
    const cat = await db
      .table("categories")
      .get({ name: category.toLowerCase() });
    await db.table("transactions").add(newTransaction);
    await db
      .table("categories")
      .update(cat.id, { current_amt: cat.current_amt + Number(input) });
    clearInputs();
    setIsOpen(false);
  };

  const openModal = (cat: any, color: any) => {
    setIsOpen(true);
    setCat(cat);
    setColor(color);
  };

  function getCatgegories(category: string, size: string) {
    switch (category) {
      case "food":
        return <IonIcon icon={Icons.fastFoodOutline} size={size} />;
      case "leisure":
        return <IonIcon icon={Icons.gameControllerOutline} size={size} />;
      case "transport":
        return <IonIcon icon={Icons.busOutline} size={size} />;
    }
  }

  function getProgressFillStyle(cat: Categories): string {
    const curr_amt = catAmount
      ? catAmount[cat.name]
        ? catAmount[cat.name].totalAmount
        : 0
      : 0;
    const percentage = curr_amt / cat.target_amt;

    const color =
      percentage > 0.9 ? "#FF0042" : percentage > 0.7 ? "#FFBD00" : "#00FFBD";

    return `conic-gradient(${color},${percentage * 360}deg,#edededb1 0deg)`;
  }

  const handleDelete = (rec: Transactions) => {
    setEditingRec(rec);
    setEditModalOpen(true);
  };

  const SwipeableItem = ({
    rec,
    onDelete,
  }: {
    rec: Transactions;
    onDelete: (rec: Transactions) => void;
  }) => {
    const [position, setPosition] = useState(0); // Tracks the swipe position
    const [isSwiping, setIsSwiping] = useState(false); // Tracks if the user is actively swiping

    const handlers = useSwipeable({
      onSwiping: ({ deltaX, deltaY }) => {
        setIsSwiping(true);
        if (Math.abs(deltaY) < Math.abs(deltaX)) setPosition(deltaX); // Update position based on swipe distance
      },
      onSwiped: (eventData) => {
        setIsSwiping(false);
        if (eventData.deltaX < -60) {
          // Trigger delete if swiped far enough
          onDelete(rec);
        }
        setPosition(0); // Reset position after swipe
      },
      preventScrollOnSwipe: false,
      trackMouse: true, // Optional: Enables swipe detection with a mouse
    });

    return (
      <div
        {...handlers}
        className="card-content"
        style={{
          transform: `translateX(${
            position < -75 ? -75 : position > 0 ? 0 : position
          }px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
      >
        <div style={{ alignItems: "center" }}>
          <span
            style={{
              color: categories?.find((cat) => cat.name === rec.category)
                ?.bkg_color,
              display: "flex",
              alignItems: "center",
            }}
          >
            {getCatgegories(rec.category, "large")}
          </span>
          <div
            style={{
              textAlign: "left",
              display: "flex",
              flexFlow: "column",
              lineHeight: "1rem",
            }}
          >
            {rec.desc}
            <div style={{ color: "rgb(152 145 145)", fontSize: "0.8rem" }}>
              {formatDateToTime(rec.date_time)}
            </div>
          </div>
          <span style={{ justifySelf: "self-end" }}>
            ${rec.amount.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  async function deleteRecHandler(rec: Transactions) {
    const cat = categories!.find((cat) => cat.name === rec.category);
    await db.table("transactions").delete(rec.id);
    setEditingRec(null);
    setEditModalOpen(false);
  }

  function EditModal({ rec }: { rec: Transactions }) {
    const { amount, desc, date_time, category } = rec;
    const catColor = categories?.find(
      (cat) => cat.name === category
    )?.bkg_color;
    return (
      <>
        <div className="modal-backdrop"></div>
        <div
          className="modal-container"
          style={{ height: "45%", justifyContent: "space-between" }}
        >
          <div className="modal-header-custom">
            <div style={{ width: 24 }}></div>
            <h3 style={{ backgroundColor: catColor }}>
              {category.replace(
                category.charAt(0),
                category.charAt(0).toUpperCase()
              )}
            </h3>

            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
              <button
                className="btn-close"
                onClick={() => setEditModalOpen(false)}
              ></button>
            </motion.div>
          </div>
          <div className="modal-amount" style={{ height: "unset" }}>
            Amount
          </div>
          <div
            style={{
              fontSize: "2rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontStyle: "oblique",
              padding: "0 40px",
              background: "#D9D9D9",
              borderRadius: "40px",
              alignSelf: "center",
            }}
            onClick={() => {
              if (catColor == null) return;
              setEditModalOpen(false);
              setInput(amount.toString());
              setCat(category);
              setColor(catColor);
              setDesc(desc);
              setDateField(date_time);
              setIsOpen(true);
            }}
          >
            ${amount}
          </div>
          <div
            style={{
              display: "flex",
              flexFlow: "row",
              padding: "0 12%",
              justifyContent: "space-between",
            }}
          >
            <div className="info">Date</div>
            <div>{formatDateFieldFullDisplay(date_time)}</div>
          </div>
          <div
            style={{
              display: "flex",
              flexFlow: "row",
              padding: "0 12%",
              justifyContent: "space-between",
            }}
          >
            <div className="info">Description</div>
            <div>{desc}</div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              className="category-icon"
              style={{ backgroundColor: "#FF0042", padding: "10px" }}
              onClick={() => deleteRecHandler(rec)}
            >
              <IonIcon icon={Icons.trashBinOutline} size="large" />
            </div>
          </div>
        </div>
      </>
    );
  }

  function formatDateToTime(date: Date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";

    // Convert 24-hour format to 12-hour format
    hours = hours % 12 || 12; // Adjust 0 to 12 for midnight/noon
    const newMinutes = minutes < 10 ? "0" + minutes : minutes; // Add leading zero to minutes if necessary

    return `${hours}:${newMinutes}${ampm}`;
  }

  function formatDate(input: string): string {
    // Parse the input string into a Date object
    const date = new Date(input);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date string");
    }

    // Extract the desired components
    const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" }); // e.g., "Sat"
    const day = date.getDate(); // e.g., 23

    // Return the formatted string
    return `${day}, ${dayOfWeek}`;
  }

  const formatDateField = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatDateFieldDisplay = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = String(date.getFullYear()).slice(2, 4);
    return `${day}-${month}-${year}`;
  };

  const formatDateFieldFullDisplay = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  return (
    <div className="container ">
      {/* Toolbar for Total Expenses */}
      <h4>Total: ${totalTransactionAmt}</h4>

      {/* Display records */}
      {displayRec != null
        ? displayRec.length > 0
          ? displayRec.map((recs, ind) => (
              <div
                key={ind}
                style={{
                  display: "flex",
                  flexFlow: "column",
                  gap: "10px",
                  paddingBottom: "14px",
                }}
              >
                <div className="card-header">
                  <p>{formatDate(recs[0])}</p>
                  <p style={{ paddingRight: "20px" }}>
                    $
                    {recs[1]
                      .reduce((prev, curr) => prev + curr.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                {recs[1].map((rec) => (
                  <SwipeableItem
                    key={rec.id}
                    rec={rec}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ))
          : "No transactions yet.."
        : "No transactions yet.."}

      {/* Category Buttons */}
      {!isCatOpen && (
        <motion.div
          className="floating-container-close"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        >
          <div
            style={{ display: "flex" }}
            onClick={() => {
              setCatOpen(true);
            }}
          >
            <IonIcon icon={Icons.addOutline} />
          </div>
        </motion.div>
      )}
      {isCatOpen && (
        <div
          className="floating-container"
          style={{
            position:
              displayRec != null
                ? displayRec.reduce((prev, curr) => prev + curr[1].length, 0) >
                  3
                  ? "sticky"
                  : "absolute"
                : "absolute",
          }}
        >
          <div className="flt-container-header">
            <h4 style={{ textAlign: "left", color: "#183A55" }}>Categories</h4>
            <motion.div
              className="close-button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
            >
              <div
                style={{ display: "flex" }}
                onClick={() => setCatOpen(false)}
              >
                <IonIcon icon={Icons.removeOutline} />
              </div>
            </motion.div>
          </div>
          <div className="d-flex justify-content-around">
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => openModal(cat.name, cat.bkg_color)}
              >
                <div
                  className="category-card-backdrop"
                  style={{ backgroundColor: cat.bkg_color }}
                ></div>
                <div>
                  {cat.name.replace(
                    cat.name.charAt(0),
                    cat.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="progress-container">
                  <div className="progress-circle">
                    <div className="progress-mask">
                      <div
                        className="category-icon"
                        style={{ backgroundColor: cat.bkg_color }}
                      >
                        {getCatgegories(cat.name, "medium")}
                      </div>
                    </div>
                    <div
                      className="progress-fill"
                      style={{
                        background: getProgressFillStyle(cat),
                      }}
                    ></div>
                  </div>
                </div>
                <div
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    padding: "0 4%",
                  }}
                >
                  $
                  {catAmount
                    ? catAmount[cat.name]
                      ? catAmount[cat.name].totalAmount.toFixed(2)
                      : 0
                    : 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for category input (if isOpen is true) */}
      {isOpen && (
        <>
          <div className="modal-backdrop"></div>
          <div className="modal-container">
            <div className="modal-header-custom">
              <div
                style={{
                  width: "100%",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "small",
                    color: "#808080",
                    paddingRight: "4px",
                  }}
                >
                  {formatDateFieldDisplay(dateField ? dateField : new Date())}
                </div>
                <IonIcon icon={Icons.calendar}></IonIcon>
                <input
                  type="date"
                  style={{
                    width: "20px",
                    border: "none",
                    maxHeight: "24px",
                    opacity: 0,
                  }}
                  value={formatDateField(dateField ? dateField : new Date())}
                  onChange={(event) => {
                    const selectedDate = new Date(event.target.value);
                    const now = new Date(); // Current date and time
                    // Set the time of the selected date to the current time
                    selectedDate.setHours(
                      now.getHours(),
                      now.getMinutes(),
                      now.getSeconds(),
                      now.getMilliseconds()
                    );
                    setDateField(selectedDate);
                  }}
                />
              </div>
              <h3 style={{ backgroundColor: catColor, margin: 0 }}>
                {category.replace(
                  category.charAt(0),
                  category.charAt(0).toUpperCase()
                )}
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  width: "100%",
                }}
              >
                <button
                  className="btn-close"
                  onClick={() => {
                    setIsOpen(false);
                    clearInputs();
                  }}
                ></button>
              </div>
            </div>
            <div className="modal-amount">
              Amount
              <div
                style={{
                  fontSize: "3rem",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontStyle: "oblique",
                }}
              >
                ${input}
              </div>
              <div style={{ width: "100%", textAlign: "center" }}>
                <input
                  placeholder="Description..."
                  onChange={(event) => setDesc(event.target.value)}
                  value={desc}
                  className="desc-input"
                ></input>
                <div className="modal-desc-tag">
                  {categories
                    ?.find((cat) => cat.name === category)
                    ?.tags.map((tag) => (
                      <div
                        key={tag}
                        className="tag"
                        onClick={() => setDesc(tag)}
                      >
                        {tag}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="calculator-container">
              <div className="calculator-row">
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(1)}
                >
                  1
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(2)}
                >
                  2
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(3)}
                >
                  3
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick("backsapce")}
                >
                  back
                </div>
              </div>
              <div className="calculator-row">
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(4)}
                >
                  4
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(5)}
                >
                  5
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(6)}
                >
                  6
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick("mulDiv")}
                >
                  &times;/÷
                </div>
              </div>
              <div className="calculator-row">
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(7)}
                >
                  7
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(8)}
                >
                  8
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(9)}
                >
                  9
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick("addMinus")}
                >
                  +/-
                </div>
              </div>
              <div className="calculator-row">
                <div className="calculator-btns" onClick={() => handleClear()}>
                  AC
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(0)}
                >
                  0
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => handleButtonClick(".")}
                >
                  .
                </div>
                <div
                  className="calculator-btns"
                  onClick={() => {
                    ops === "" ? handleSubmit() : handleButtonClick("=");
                  }}
                  style={{ backgroundColor: catColor, color: "white" }}
                >
                  {ops === "" ? "Save" : "="}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isEditModalOpen && editingRec != null ? (
        <EditModal rec={editingRec} />
      ) : (
        <></>
      )}
    </div>
  );
};

export default TransactionContainer;

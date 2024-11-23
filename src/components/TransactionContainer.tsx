import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import "./transactionContainer.css";
import { IonIcon } from "@ionic/react";
import * as Icons from "ionicons/icons";
import db, { Categories, getTransactionWithinMonth, Transactions } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const TransactionContainer = ({ date }: { date: Date }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCat] = useState("");
  const descRef = useRef<HTMLInputElement>(null);
  const [catColor, setColor] = useState("");
  const [dayInput, setDayInput] = useState(new Date().getDate());
  const [mayRecords, setMayRecords] = useState([]);
  const [currRec, setCurrRec] = useState<any[]>([]);
  const [ops, setOps] = useState("");
  const [input, setInput] = useState("");
  const [mthRecStoreField, setMonth] = useState("");
  const [totalExpense, setTotalExpense] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [desc, setDesc] = useState("");
  const [displayRec, setDisplayRec] = useState<
    [string, Transactions[]][] | null
  >(null);

  //new variable
  const [isCatOpen, setCatOpen] = useState(true);

  const categories: Categories[] | undefined = useLiveQuery(
    () => db.table("categories").toArray(), // Dexie query: fetch all users
    [] // Dependency array: live query always listens for changes, so no dependencies are required here
  );

  useEffect(() => {
    getTransactionWithinMonth(date).then((recs) => {
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
  }, [date, isOpen]);

  const addExpense = (day: any, expense: any) => {
    const index = currRec.findIndex((item) => item.hasOwnProperty(day));
    if (index !== -1) {
      const updatedRec = [...currRec];
      updatedRec[index][day].push(expense);
      updatedRec[index].total += expense.amount;
      setCurrRec(updatedRec);
    } else {
      const newDay = { [day]: [expense], total: expense.amount };
      setCurrRec([...currRec, newDay]);
    }
  };

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

  const handleSubmit = async () => {
    const newTransaction: Omit<Transactions, "id"> = {
      category: category.toLowerCase(),
      desc: desc !== "" ? desc : category.toLowerCase(),
      amount: Number(input),
      date_time: new Date(),
    };
    const cat = await db
      .table("categories")
      .get({ name: category.toLowerCase() });
    await db.table("transactions").add(newTransaction);
    await db
      .table("categories")
      .update(cat.id, { current_amt: cat.current_amt + Number(input) });
    setInput("");
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
    const percentage = cat.current_amt / cat.target_amt;

    const color =
      percentage > 0.9 ? "#FF0042" : percentage > 0.7 ? "#FFBD00" : "#00FFBD";

    return `conic-gradient(${color},${percentage * 360}deg,#edededb1 0deg)`;
  }

  return (
    <div className="container ">
      {/* Toolbar for Total Expenses */}
      <h4>Transactions</h4>

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
                  <p>{recs[0]}</p>
                  <p>
                    ${recs[1].reduce((prev, curr) => prev + curr.amount, 0)}
                  </p>
                </div>
                {recs[1].map((rec) => (
                  <div className="card-content" key={rec.id}>
                    <div style={{ alignItems: "center" }}>
                      <span
                        style={{
                          color: categories?.find(
                            (cat) => cat.name === rec.category
                          )?.bkg_color,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {getCatgegories(rec.category, "large")}
                      </span>
                      <span style={{ textAlign: "left" }}>{rec.desc}</span>
                      <span style={{ justifySelf: "self-end" }}>
                        ${rec.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))
          : "No transactions yet.."
        : "No transactions yet.."}

      {/* <div>
        <div className="card-header">
          <p>May 5</p>
          <p>Total: $100</p>
        </div>
        <div className="card-content">
          <div className="d-flex justify-content-between">
            <span>{getCatgegories("food")}</span>
            <span>{"Lunch"}</span>
            <span>${100}</span>
          </div>
        </div>
      </div> */}

      {/* Category Buttons */}
      {!isCatOpen && (
        <div
          className="floating-container-close"
          onClick={() => setCatOpen(true)}
        >
          <IonIcon icon={Icons.addOutline} />
        </div>
      )}
      {isCatOpen && (
        <div className="floating-container">
          <div className="flt-container-header">
            <h4 style={{ textAlign: "left", color: "#183A55" }}>Categories</h4>
            <div className="close-button" onClick={() => setCatOpen(false)}>
              <IonIcon icon={Icons.removeOutline} />
            </div>
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
                <div>${cat.current_amt}</div>
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
              <div style={{ width: 24 }}></div>
              <h3 style={{ backgroundColor: catColor }}>
                {category.replace(
                  category.charAt(0),
                  category.charAt(0).toUpperCase()
                )}
              </h3>
              <button
                className="btn-close"
                onClick={() => setIsOpen(false)}
              ></button>
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
    </div>
  );
};

export default TransactionContainer;

import * as React from "react";
import { List, arrayMove } from "react-movable";
import db, { Categories } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { getCatgegories } from "../components/TransactionContainer";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import * as Icons from "ionicons/icons";
import "./tab3.css";
import { relative } from "path";

const Tab3 = () => {
  const [items, setItems] = React.useState<Categories[]>([]);
  const [nonItems, setNonItems] = React.useState<Categories[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<Categories | null>(
    null
  );
  const [budgetModal, setBudgetModal] = React.useState(false);
  const budgetAmt = React.useRef<HTMLInputElement>(null);
  const categoriesQuery: Categories[] | undefined = useLiveQuery(
    async () => {
      const result = (await db.table("categories").toArray()).sort(
        (a, b) => a.order - b.order
      );
      setItems(result.filter((cat) => cat.target_amt !== 0));
      setNonItems(result.filter((cat) => cat.target_amt === 0));
      return result;
    }, // Dexie query: fetch all users
    [] // Dependency array: live query always listens for changes, so no dependencies are required here
  );
  const [editable, setEditable] = React.useState<boolean>(false);

  const [formData, setFormData] = React.useState({
    category: "",
    monthlyBudget: "",
    tags: "",
    orderSequence: "",
  });

  function Item(
    cat: Categories,
    openModal: (state: boolean) => void
  ): React.ReactNode {
    return (
      <div
        style={{
          display: "flex",
          gap: "16px",
          padding: "4px 0px",
          borderRadius: "8px",
        }}
      >
        <span
          style={{
            color: cat.bkg_color,
            display: "flex",
            alignItems: "center",
            fontSize: "24px",
          }}
        >
          {getCatgegories(cat.name, "")}
        </span>
        <div
          style={{
            textAlign: "left",
            display: "flex",
            justifyContent: "center",
            flexFlow: "column",
            lineHeight: "1rem",
            width: "100%",
          }}
        >
          {cat.name.replace(cat.name[0], cat.name[0].toUpperCase())}
        </div>
        {cat.target_amt !== 0 ? (
          <div
            style={{
              display: "flex",
              flexFlow: "row",
              justifyContent: "center",
              alignItems: "center ",
              gap: "4px",
            }}
          >
            ${cat.target_amt}
            {editable && (
              <>
                <button
                  style={{
                    all: "unset",
                    color: "#FF7043",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    openModal(true);
                    setSelectedItem(cat);
                    setFormData(() => ({
                      category: cat.name.replace(
                        cat.name.charAt(0),
                        cat.name.charAt(0).toUpperCase()
                      ),
                      monthlyBudget: cat.target_amt.toString(),
                      tags: cat.tags.join(","),
                      orderSequence: cat.order.toString(),
                    }));
                  }}
                >
                  <IonIcon icon={Icons.createOutline}></IonIcon>
                </button>
                <button
                  style={{
                    all: "unset",
                    color: "#C30000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    handleDelete(cat);
                  }}
                >
                  <IonIcon icon={Icons.closeCircleOutline}></IonIcon>
                </button>
                <IonIcon icon={Icons.menuOutline}></IonIcon>
              </>
            )}
          </div>
        ) : (
          <div className="primary-button">
            <button
              style={{ all: "unset" }}
              onClick={() => {
                openModal(true);
                setSelectedItem(cat);
                setFormData(() => ({
                  category: cat.name.replace(
                    cat.name.charAt(0),
                    cat.name.charAt(0).toUpperCase()
                  ),
                  monthlyBudget: "",
                  tags: cat.tags.join(","),
                  orderSequence: cat.order.toString(),
                }));
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>
    );
  }

  async function handleDelete(cat: Categories) {
    await db.table("categories").update(cat.id, {
      target_amt: 0,
    });
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation for monthly budget
    if (parseFloat(formData.monthlyBudget) <= 0) {
      alert("Monthly Budget must be greater than 0.");
      return;
    }

    if (selectedItem == null) {
      setBudgetModal(false);
      // Clear form
      setFormData({
        category: "",
        monthlyBudget: "",
        tags: "",
        orderSequence: "",
      });
      return;
    }
    await db.table("categories").update(selectedItem.id, {
      target_amt: parseFloat(formData.monthlyBudget),
      tags: formData.tags.split(","),
      order: formData.orderSequence,
    });

    setSelectedItem(null);
    setBudgetModal(false);
    // Clear form
    setFormData({
      category: "",
      monthlyBudget: "",
      tags: "",
      orderSequence: "",
    });
  };

  function formContent() {
    const styles = {
      container: {
        maxWidth: "400px",
        margin: "20px auto",
        padding: "20px",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        fontFamily: "Arial, sans-serif",
        color: "#183A55",
      },
      heading: {
        textAlign: "center",
        marginBottom: "20px",
      },
      form: {
        display: "flex",
        flexDirection: "column",
      },
      formGroup: {
        marginBottom: "15px",
      },
      label: {
        marginBottom: "5px",
        fontWeight: "bold",
      },
      input: {
        width: "100%",
        padding: "10px",
        fontSize: "16px",
        border: "1px solid #ccc",
        borderRadius: "4px",
      },
      button: {
        padding: "10px 15px",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#28A745",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
      },
      buttonHover: {
        backgroundColor: "#218838",
      },
    };
    return (
      <>
        <form
          style={{ display: "flex", flexDirection: "column" }}
          onSubmit={handleSubmit}
        >
          {/* Category */}
          <div style={styles.formGroup}>
            <label htmlFor="category" style={styles.label}>
              Category:
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={styles.input}
              disabled
            />
          </div>

          {/* Monthly Budget */}
          <div style={styles.formGroup}>
            <label htmlFor="monthlyBudget" style={styles.label}>
              Monthly Budget:
            </label>
            <input
              type="number"
              id="monthlyBudget"
              name="monthlyBudget"
              placeholder="Enter monthly budget"
              value={formData.monthlyBudget}
              onChange={handleChange}
              style={styles.input}
              min="1"
              step="1"
              required
            />
          </div>

          {/* Tags */}
          <div style={styles.formGroup}>
            <label htmlFor="tags" style={styles.label}>
              Tags:
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              placeholder="Enter tags (comma-separated)"
              value={formData.tags}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* Order Sequence */}
          <div style={styles.formGroup}>
            <label htmlFor="orderSequence" style={styles.label}>
              Order Sequence:
            </label>
            <input
              type="number"
              id="orderSequence"
              name="orderSequence"
              placeholder="Enter order sequence"
              value={formData.orderSequence}
              onChange={handleChange}
              style={styles.input}
              min="1"
              step="1"
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "end" }}>
            <div className="primary-button" style={{ background: "#3DBEAC" }}>
              <button type="submit" style={{ all: "unset" }}>
                Save
              </button>
            </div>
          </div>
        </form>
      </>
    );
  }

  function AddBudgetModal(onClose: (state: boolean) => void) {
    return (
      <>
        <div className="modal-backdrop"></div>
        <div className="modal-float-container">
          <div className="modal-container-center">
            <div
              className="modal-header-custom"
              style={{
                fontWeight: "bold",
                marginBottom: "4px",
                position: "relative",
                justifyContent: "center",
                color: "#183A55",
                fontSize: "20px",
              }}
            >
              {`New Category`}
              <button
                className="btn-close"
                onClick={() => {
                  setSelectedItem(null);
                  onClose(false);
                }}
                style={{ position: "absolute", right: "0", fontSize: "16px" }}
              ></button>
            </div>
            {formContent()}
          </div>
        </div>
      </>
    );
  }

  // Handle item reorder
  const handleReorder = async ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    const newCategories = arrayMove(items, oldIndex, newIndex);

    const allCategories = [...newCategories, ...nonItems];
    // Update the order field based on the new positions
    const updatedCategories = allCategories.map((category, index) => ({
      ...category,
      order: index + 1, // Set the new order starting from 1
    }));

    // Save the updated order to the database
    await Promise.all(
      updatedCategories.map((category) => db.table("categories").put(category))
    );

    // Update the state with the new order
    setItems(updatedCategories.filter((cat) => cat.target_amt > 0));
  };

  return (
    <>
      <div className="container-fluid page">
        <div className="content">
          <div className="row justify-content-center text-center py-3">
            <div
              className="col-12 col-md-6 d-flex justify-content-center align-items-center"
              style={{ color: "#183A55", fontWeight: 700, fontSize: "18px" }}
            >
              Settings
            </div>
          </div>
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "15px 20px",
              display: "flex",
              flexFlow: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#3F3F3F",
                fontWeight: "bold",
                borderBottom: "1px solid grey",
                padding: "0 10px",
              }}
            >
              <div>Category</div>
              <div style={{ justifySelf: "flex-end" }}>Budget</div>
            </div>
            {editable ? (
              <List
                values={items}
                onChange={({ oldIndex, newIndex }) => {
                  handleReorder({ oldIndex, newIndex });
                }}
                renderList={({ children, props }) => (
                  <div
                    style={{ display: "flex", flexFlow: "column", gap: "10px" }}
                    {...props}
                  >
                    {children}
                  </div>
                )}
                renderItem={({ value, props }) => (
                  <div {...props}>{Item(value, setBudgetModal)}</div>
                )}
                lockVertically={true}
                transitionDuration={0}
              />
            ) : (
              <div style={{ display: "flex", flexFlow: "column", gap: "10px" }}>
                {items.map((cat, ind) => (
                  <div key={ind}>{Item(cat, setBudgetModal)}</div>
                ))}
              </div>
            )}
            {editable && (
              <div style={{ display: "flex", flexFlow: "column", gap: "10px" }}>
                {nonItems.map((cat, ind) => (
                  <div key={ind}>{Item(cat, setBudgetModal)}</div>
                ))}
              </div>
            )}
            <div style={{ border: "1px solid #c7c7c7" }}></div>
            <div style={{ display: "flex", alignSelf: "self-end" }}>
              <div
                className="primary-button"
                style={{ background: editable ? "#3DBEAC" : "#FF7043" }}
              >
                <button
                  style={{ all: "unset" }}
                  onClick={() => {
                    if (editable) {
                      setEditable(false);
                    } else {
                      setEditable(true);
                    }
                  }}
                >
                  {editable ? "Done Editing" : "Edit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {budgetModal && AddBudgetModal(setBudgetModal)}
    </>
  );
};

export default Tab3;

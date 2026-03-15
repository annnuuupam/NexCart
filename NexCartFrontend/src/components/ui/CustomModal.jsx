import React, { useEffect, useState } from "react";
import "../../styles/modalStyles.css";
import API_BASE_URL from '../../config/api';

const toInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};
const getProductPayload = (response) => response?.product?.product || response?.product || null;

const CustomModal = ({ modalType, onClose, onSubmit, response, initialData }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    imageUrl: "",
    month: "",
    year: "",
    date: "",
  });
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if ((modalType === "deleteProduct" || modalType === "viewUser") && initialData) {
      const presetId = initialData.id ?? initialData.productId ?? initialData.userId;
      if (presetId !== undefined && presetId !== null) {
        setInputValue(String(presetId));
      }
    }
  }, [modalType, initialData]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGeneralInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    switch (modalType) {
      case "addProduct": {
        onSubmit({
          ...formData,
          price: parseFloat(formData.price),
          stock: toInt(formData.stock),
          categoryId: toInt(formData.categoryId),
        });
        break;
      }
      case "deleteProduct": {
        const productId = toInt(inputValue);
        if (productId !== null) {
          onSubmit({ productId });
        }
        break;
      }
      case "viewUser": {
        const userId = toInt(inputValue);
        if (userId !== null) {
          onSubmit({ userId });
        }
        break;
      }
      case "monthlyBusiness":
        onSubmit({ month: formData.month, year: formData.year });
        break;
      case "dailyBusiness":
        onSubmit({ date: formData.date });
        break;
      case "yearlyBusiness":
        onSubmit({ year: formData.year });
        break;
      case "overallBusiness":
        onSubmit();
        break;
      default:
        break;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {modalType === "addProduct" &&
          (!response ? (
            <>
              <h2>Add Product</h2>
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="modal-form-item">
                  <label htmlFor="name">Name:</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="modal-form-item">
                  <label htmlFor="price">Price:</label>
                  <input type="number" id="price" name="price" value={formData.price} onChange={handleInputChange} />
                </div>
                <div className="modal-form-item">
                  <label htmlFor="stock">Stock:</label>
                  <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleInputChange} />
                </div>
                <div className="modal-form-item">
                  <label htmlFor="categoryId">Category ID:</label>
                  <input type="number" id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleInputChange} />
                </div>
                <div className="modal-form-item">
                  <label htmlFor="imageUrl">Image URL:</label>
                  <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
                </div>
                <div className="modal-form-item">
                  <label htmlFor="description">Description:</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                </div>
                <button type="submit">Submit</button>
                <button type="button" onClick={onClose}>Cancel</button>
              </form>
            </>
          ) : (
            <>
              <h2>Product Details</h2>
              <div className="full-products">
                <div className="product-details img">
                  <img src={response?.product?.imageUrl || response?.imageUrl} alt="Product" />
                </div>
                <div className="product-details-info">
                  <div className="product-details"><div>Name :</div><div>{getProductPayload(response)?.name || "-"}</div></div>
                  <div className="product-details"><div>Description :</div><div>{getProductPayload(response)?.description || "-"}</div></div>
                  <div className="product-details"><div>Price :</div><div>{getProductPayload(response)?.price ?? "-"}</div></div>
                  <div className="product-details"><div>Stock :</div><div>{getProductPayload(response)?.stock ?? "-"}</div></div>
                  <div className="product-details"><div>Category :</div><div>{getProductPayload(response)?.category?.categoryName || "-"}</div></div>
                </div>
              </div>
              <button onClick={onClose}>Close</button>
            </>
          ))}

        {modalType === "deleteProduct" &&
          (!response ? (
            <>
              <h2>Delete Product</h2>
              <form onSubmit={handleSubmit}>
                <input type="number" placeholder="Enter Product ID" value={inputValue} onChange={handleGeneralInputChange} />
                <button type="submit">Delete</button>
                <button type="button" onClick={onClose}>Cancel</button>
              </form>
            </>
          ) : (
            <div>
              <h2>{response?.message || "Product Deleted Successfully"}</h2>
              <button onClick={onClose}>Close</button>
            </div>
          ))}

        {modalType === "viewUser" && (
          <>
            <h2>View User Details</h2>
            <form onSubmit={handleSubmit}>
              <input type="number" placeholder="Enter User ID" value={inputValue} onChange={handleGeneralInputChange} />
              <button type="submit">Submit</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}

        {modalType === "response" && response && (
          <>
            {response.user ? (
              <>
                <h2>User Details</h2>
                <div className="user-details">
                  <p><strong>User ID:</strong> {response.user.userId}</p>
                  <p><strong>Username:</strong> {response.user.username}</p>
                  <p><strong>Email:</strong> {response.user.email}</p>
                  <p><strong>Role:</strong> {response.user.role}</p>
                  <p><strong>Created At:</strong> {response.user.createdAt ? new Date(response.user.createdAt).toLocaleString() : "-"}</p>
                  <p><strong>Updated At:</strong> {response.user.updatedAt ? new Date(response.user.updatedAt).toLocaleString() : "-"}</p>
                </div>
              </>
            ) : (
              <>
                <h2>Response</h2>
                <p>{response?.message || "Something went wrong."}</p>
              </>
            )}
            <button onClick={onClose}>Back to Dashboard</button>
          </>
        )}

        {modalType === "monthlyBusiness" && (
          <>
            <form className="modal-form" onSubmit={handleSubmit}>
              {!response && (
                <>
                  <div className="modal-form-item">
                    <label htmlFor="month">Month:</label>
                    <input type="number" id="month" name="month" placeholder="10" onChange={handleInputChange} />
                  </div>
                  <div className="modal-form-item">
                    <label htmlFor="year">Year:</label>
                    <input type="number" id="year" name="year" placeholder="2026" onChange={handleInputChange} />
                  </div>
                  <button type="submit">Submit</button>
                </>
              )}
              {response && (
                <div>
                  <div className="business-response-item">
                    <div>Total Business: INR</div>
                    <div>{response?.monthlyBusiness?.totalBusiness?.toFixed?.(2) ?? response?.monthlyBusiness?.totalBusiness ?? "-"}</div>
                  </div>
                  <div className="business-response-item"><h5>Category Sales</h5></div>
                  {Object.keys(response?.monthlyBusiness?.categorySales || {}).map((key) => (
                    <div key={key} className="business-response-item">
                      <div>{key}</div>
                      <div>{response?.monthlyBusiness?.categorySales?.[key]}</div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}

        {modalType === "dailyBusiness" && (
          <>
            <form className="modal-form" onSubmit={handleSubmit}>
              {!response && (
                <>
                  <div className="modal-form-item">
                    <label htmlFor="date">Date:</label>
                    <input type="text" id="date" name="date" placeholder="2026-03-08" onChange={handleInputChange} />
                  </div>
                  <button type="submit">Submit</button>
                </>
              )}
              {response && (
                <div>
                  <div className="business-response-item">
                    <div>Total Business: INR</div>
                    <div>{response?.dailyBusiness?.totalBusiness?.toFixed?.(2) ?? response?.dailyBusiness?.totalBusiness ?? "-"}</div>
                  </div>
                  <div className="business-response-item"><h5>Category Sales</h5></div>
                  {Object.keys(response?.dailyBusiness?.categorySales || {}).map((key) => (
                    <div key={key} className="business-response-item">
                      <div>{key}</div>
                      <div>{response?.dailyBusiness?.categorySales?.[key]}</div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}

        {modalType === "yearlyBusiness" && (
          <>
            <form className="modal-form" onSubmit={handleSubmit}>
              {!response && (
                <>
                  <div className="modal-form-item">
                    <label htmlFor="year">Year:</label>
                    <input type="number" id="year" name="year" placeholder="2026" onChange={handleInputChange} />
                  </div>
                  <button type="submit">Submit</button>
                </>
              )}
              {response && (
                <div>
                  <div className="business-response-item">
                    <div>Total Business: INR</div>
                    <div>{response?.yearlyBusiness?.totalBusiness?.toFixed?.(2) ?? response?.yearlyBusiness?.totalBusiness ?? "-"}</div>
                  </div>
                  <div className="business-response-item"><h5>Category Sales</h5></div>
                  {Object.keys(response?.yearlyBusiness?.categorySales || {}).map((key) => (
                    <div key={key} className="business-response-item">
                      <div>{key}</div>
                      <div>{response?.yearlyBusiness?.categorySales?.[key]}</div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}

        {modalType === "overallBusiness" && (
          <>
            <form className="modal-form" onSubmit={handleSubmit}>
              {!response && <button type="submit">Get Overall Business</button>}
              {response && (
                <div>
                  <div className="business-response-item">
                    <div>Total Business: INR</div>
                    <div>{response?.overallBusiness?.totalBusiness?.toFixed?.(2) ?? response?.overallBusiness?.totalBusiness ?? "-"}</div>
                  </div>
                  <div className="business-response-item"><h5>Category Sales</h5></div>
                  {Object.keys(response?.overallBusiness?.categorySales || {}).map((key) => (
                    <div key={key} className="business-response-item">
                      <div>{key}</div>
                      <div>{response?.overallBusiness?.categorySales?.[key]}</div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}

        {modalType === "modifyUser" && <ModifyUserFormComponent onClose={onClose} initialData={initialData} />}
      </div>
    </div>
  );
};

export default CustomModal;

const ModifyUserFormComponent = ({ onClose, initialData }) => {
  const [userId, setUserId] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");

  const fetchUserById = async (numericUserId) => {
    const response = await fetch(`${API_BASE_URL}/admin/user/getbyid`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: numericUserId }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "User not found.");
    }

    const user = await response.json();
    setUserDetails(user);
    setUserId(String(user.userId));
  };

  useEffect(() => {
    if (!initialData?.userId) return;
    const numericUserId = toInt(initialData.userId);
    if (numericUserId === null) return;

    setError("");
    fetchUserById(numericUserId).catch((fetchError) => {
      setError(fetchError.message || "Error fetching user details.");
    });
  }, [initialData]);

  const handleFetchUser = async (e) => {
    e.preventDefault();
    setError("");

    const numericUserId = toInt(userId);
    if (numericUserId === null) {
      setError("Please enter a valid user ID.");
      return;
    }

    try {
      await fetchUserById(numericUserId);
    } catch (fetchError) {
      setError(fetchError.message || "Error fetching user details.");
      console.error(fetchError);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.target);
    const payload = {
      userId: toInt(userId),
      username: formData.get("username"),
      email: formData.get("email"),
      role: formData.get("role"),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/admin/user/modify`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        setError(message || "Failed to update user.");
        return;
      }

      const user = await response.json();
      setUpdated(true);
      setUserDetails(user);
    } catch (updateError) {
      setError("Error updating user.");
      console.error(updateError);
    }
  };

  if (!userDetails) {
    return (
      <form onSubmit={handleFetchUser} className="modal-form">
        <h2>Modify User</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="modal-form-item">
          <label htmlFor="user-id">User ID:</label>
          <input type="text" id="user-id" name="user-id" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <button type="submit">Get User</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    );
  }

  if (userDetails && !updated) {
    return (
      <div>
        <form onSubmit={handleUpdateUser} className="modal-form">
          <h2>Edit User</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-form-item">
            <label htmlFor="user-id">User ID:</label>
            <input type="text" id="user-id" name="user-id" value={userDetails?.userId || userId} readOnly />
          </div>
          <div className="modal-form-item">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" defaultValue={userDetails?.username || ""} />
          </div>
          <div className="modal-form-item">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" defaultValue={userDetails?.email || ""} />
          </div>
          <div className="modal-form-item">
            <label htmlFor="role">Role:</label>
            <input type="text" id="role" name="role" defaultValue={userDetails?.role || "CUSTOMER"} />
          </div>
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2>Updated User Details</h2>
      <div className="user-details">
        <p><strong>User ID:</strong> {userDetails.userId}</p>
        <p><strong>Username:</strong> {userDetails.username}</p>
        <p><strong>Email:</strong> {userDetails.email}</p>
        <p><strong>Role:</strong> {userDetails.role}</p>
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};



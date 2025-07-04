// utils/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/canvas"; // Update with your actual API base URL

export const createCanvas = async () => {
  try {
    const token = localStorage.getItem('whiteboard_user_token');
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.post(
      `${API_BASE_URL}/create`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Canvas created successfully!", response.data);
    return response.data; 
  } catch (error) {
    console.error("Error creating canvas:", error);
    throw error;
  }
};

export const updateCanvas = async (canvasId, elements) => {
  try {
    const token = localStorage.getItem('whiteboard_user_token');
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.put(
      `${API_BASE_URL}/update`,
      { canvasId, elements },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Canvas updated successfully in the database!", response.data);
    return response.data; 
  } catch (error) {
    console.error("Error updating canvas:", error);
    throw error;
  }
};

export const fetchInitialCanvasElements = async (canvasId) => {
  try {
    const token = localStorage.getItem('whiteboard_user_token');
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(`${API_BASE_URL}/load/${canvasId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.elements;
  } catch (error) {
    console.error("Error fetching initial canvas elements:", error);
    throw error;
  }
};

export const getUserCanvases = async () => {
  try {
    const token = localStorage.getItem('whiteboard_user_token');
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(`${API_BASE_URL}/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user canvases:", error);
    throw error;
  }
};
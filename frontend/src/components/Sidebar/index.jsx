import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './index.min.css';
import { useNavigate } from 'react-router-dom';
import boardContext from '../../store/board-context';
import { useParams } from 'react-router-dom';
import { createCanvas, getUserCanvases } from '../../utils/api';

const Sidebar = () => {
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('whiteboard_user_token');
  const { canvasId, setCanvasId, isUserLoggedIn, setUserLoginStatus } = useContext(boardContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { id } = useParams(); 

  // Fetch canvases when user login status changes
  useEffect(() => {
    if (isUserLoggedIn) {
      fetchCanvases();
    } else {
      setCanvases([]);
    }
  }, [isUserLoggedIn]);

  // Handle URL parameter changes
  useEffect(() => {
    if (id && isUserLoggedIn) {
      console.log("URL parameter changed to:", id);
      setCanvasId(id);
    }
  }, [id, isUserLoggedIn, setCanvasId]);

  const fetchCanvases = async () => {
    if (!isUserLoggedIn) return;
    
    setLoading(true);
    try {
      const response = await getUserCanvases();
      setCanvases(response);
      console.log("Fetched canvases:", response);
      
      // If no canvases exist, create one
      if (response.length === 0) {
        console.log("No canvases found, creating new one");
        const newCanvas = await handleCreateCanvas();
        if (newCanvas) {
          navigate(`/${newCanvas.canvasId}`);
        }
      } else if (!id && response.length > 0) {
        // If no specific canvas in URL, navigate to first canvas
        console.log("No canvas in URL, navigating to first canvas:", response[0]._id);
        navigate(`/${response[0]._id}`);
      }
    } catch (error) {
      console.error('Error fetching canvases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCanvas = async () => {
    if (!isUserLoggedIn) {
      alert("Please log in to create a canvas");
      return null;
    }

    setLoading(true);
    try {
      const response = await createCanvas();
      console.log("Created new canvas:", response);
      
      // Refresh canvas list
      await fetchCanvases();
      
      return response;
    } catch (error) {
      console.error('Error creating canvas:', error);
      alert("Failed to create canvas. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCanvas = async (canvasIdToDelete) => {
    if (!isUserLoggedIn) {
      alert("Please log in to delete a canvas");
      return;
    }

    if (!confirm("Are you sure you want to delete this canvas?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/canvas/delete/${canvasIdToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh canvas list
      await fetchCanvases();
      
      // If we deleted the current canvas, navigate to another one
      if (canvasIdToDelete === id) {
        const remainingCanvases = canvases.filter(c => c._id !== canvasIdToDelete);
        if (remainingCanvases.length > 0) {
          navigate(`/${remainingCanvases[0]._id}`);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error deleting canvas:', error);
      alert("Failed to delete canvas. Please try again.");
    }
  };

  const handleCanvasClick = (canvasId) => {
    console.log("Canvas clicked:", canvasId);
    console.log("Current URL id:", id);
    console.log("Navigating to:", `/${canvasId}`);
    navigate(`/${canvasId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('whiteboard_user_token');
    setCanvases([]);
    setUserLoginStatus(false);
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email.");
      return;
    }

    if (!canvasId) {
      setError("No canvas selected.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await axios.put(
        `http://localhost:5000/api/canvas/share/${canvasId}`,
        { email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      setEmail("");
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to share canvas.");
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  return (
    <div className="sidebar">
      <button 
        className="create-button" 
        onClick={handleCreateCanvas} 
        disabled={!isUserLoggedIn || loading}
      >
        {loading ? "Creating..." : "+ Create New Canvas"}
      </button>
      
      <ul className="canvas-list">
        {canvases.map(canvas => (
          <li 
            key={canvas._id} 
            className={`canvas-item ${canvas._id === id ? 'selected' : ''}`}
          >
            <span 
              className="canvas-name" 
              onClick={() => handleCanvasClick(canvas._id)}
              style={{ cursor: 'pointer' }}
            >
              Canvas {canvas._id.slice(-6)}
            </span>
            <button 
              className="delete-button" 
              onClick={() => handleDeleteCanvas(canvas._id)}
              disabled={loading}
            >
              del
            </button>
          </li>
        ))}
      </ul>
      
      <div className="share-container">
        <input
          type="email"
          placeholder="Enter email to share"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!isUserLoggedIn || !canvasId}
        />
        <button 
          className="share-button" 
          onClick={handleShare} 
          disabled={!isUserLoggedIn || !canvasId || loading}
        >
          Share
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
      
      {isUserLoggedIn ? (
        <button className="auth-button logout-button" onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <button className="auth-button login-button" onClick={handleLogin}>
          Login
        </button>
      )}
    </div>
  );
};

export default Sidebar;
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import socket from "../../utils/socket";
import { updateCanvas } from "../../utils/api";

import classes from "./index.module.css";

import {
  getSvgPathFromStroke,
} from "../../utils/element";
import getStroke from "perfect-freehand";

function Board({ id }) {
  const canvasRef = useRef();
  const textAreaRef = useRef();

  const {
    elements,
    toolActionType,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo,
    redo,
    setCanvasId,
    canvasId,
    isUserLoggedIn,
    loadCanvasElements
  } = useContext(boardContext);
  const { toolboxState } = useContext(toolboxContext);

  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Handle canvas ID changes
  useEffect(() => {
    console.log("Board component received ID:", id);
    if (id) {
      console.log("Setting canvas ID in Board component:", id);
      setCanvasId(id);
    }
  }, [id, setCanvasId]);

  // Force canvas loading when ID changes
  useEffect(() => {
    if (id && isUserLoggedIn) {
      console.log("Force loading canvas elements for ID:", id);
      // Small delay to ensure state is updated
      setTimeout(() => {
        loadCanvasElements(id);
      }, 100);
    }
  }, [id, isUserLoggedIn]);

  // Handle socket connection and canvas joining
  useEffect(() => {
    if (id && isUserLoggedIn) {
      console.log("Joining canvas room:", id);
      
      // Join the canvas room
      socket.emit("joinCanvas", { canvasId: id });

      // Listen for updates from other users
      socket.on("receiveDrawingUpdate", (updatedElements) => {
        console.log("Received drawing update from socket:", updatedElements);
        // Don't update elements here as they should come from the database
      });

      // Load initial canvas data
      socket.on("loadCanvas", (initialElements) => {
        console.log("Received initial canvas data from socket:", initialElements);
        // Don't update elements here as they should come from the database
      });

      socket.on("unauthorized", (data) => {
        console.log("Socket unauthorized:", data.message);
        alert("Access Denied: You cannot edit this canvas.");
        setIsAuthorized(false);
      });

      return () => {
        console.log("Cleaning up socket listeners for canvas:", id);
        socket.off("receiveDrawingUpdate");
        socket.off("loadCanvas");
        socket.off("unauthorized");
      };
    }
  }, [id, isUserLoggedIn]);

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key === "z") {
        undo();
      } else if (event.ctrlKey && event.key === "y") {
        redo();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  // Render canvas elements
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();

    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(element.roughEle);
          break;
        case TOOL_ITEMS.BRUSH:
          context.fillStyle = element.stroke;
          const path = new Path2D(getSvgPathFromStroke(getStroke(element.points)));
          context.fill(path);
          context.restore();
          break;
        case TOOL_ITEMS.TEXT:
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text, element.x1, element.y1);
          context.restore();
          break;
        default:
          throw new Error("Type not recognized");
      }
    });

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);

  // Handle text area focus
  useEffect(() => {
    const textarea = textAreaRef.current;
    if (toolActionType === TOOL_ACTION_TYPES.WRITING && textarea) {
      setTimeout(() => {
        textarea.focus();
      }, 0);
    }
  }, [toolActionType]);

  const handleMouseDown = (event) => {
    if (!isAuthorized || isLoading) return;
    boardMouseDownHandler(event, toolboxState);
  };

  const handleMouseMove = (event) => {
    if (!isAuthorized || isLoading) return;
    boardMouseMoveHandler(event);
    
    // Only emit socket update if we're actively drawing
    if (id && elements.length > 0 && toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      socket.emit("drawingUpdate", { canvasId: id, elements });
    }
  };

  const handleMouseUp = async () => {
    if (!isAuthorized || isLoading) return;
    boardMouseUpHandler();
    
    // Emit socket update for real-time collaboration
    if (id && elements.length > 0) {
      socket.emit("drawingUpdate", { canvasId: id, elements });
    }
    
    // Save to database if user is logged in
    if (isUserLoggedIn && canvasId) {
      try {
        console.log("Saving canvas to database:", { canvasId, elementsCount: elements.length });
        await updateCanvas(canvasId, elements);
        console.log("Canvas saved successfully!");
      } catch (error) {
        console.error("Failed to save canvas to database:", error);
      }
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        You are not authorized to access this canvas.
      </div>
    );
  }

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && elements.length > 0 && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements[elements.length - 1].y1,
            left: elements[elements.length - 1].x1,
            fontSize: `${elements[elements.length - 1]?.size}px`,
            color: elements[elements.length - 1]?.stroke,
          }}
          onBlur={(event) => textAreaBlurHandler(event.target.value)}
        />
      )}
      <canvas
        ref={canvasRef}
        id="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isLoading ? 'wait' : 'crosshair' }}
      />
    </>
  );
}

export default Board;
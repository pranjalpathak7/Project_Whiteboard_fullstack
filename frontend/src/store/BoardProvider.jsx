import React, { useCallback, useReducer, useEffect } from "react";
import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import {
  createElement,
  isPointNearElement,
} from "../utils/element";
import { updateCanvas, fetchInitialCanvasElements } from "../utils/api";

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL: {
      return {
        ...state,
        activeToolItem: action.payload.tool,
      };
    }
    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return {
        ...state,
        toolActionType: action.payload.actionType,
      };
    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const newElement = createElement(
        state.elements.length,
        clientX,
        clientY,
        clientX,
        clientY,
        { type: state.activeToolItem, stroke, fill, size }
      );
      const prevElements = state.elements;
      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...prevElements, newElement],
      };
    }
    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = state.elements.length - 1;
      const { type } = newElements[index];
      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          const { x1, y1, stroke, fill, size } = newElements[index];
          const newElement = createElement(index, x1, y1, clientX, clientY, {
            type: state.activeToolItem,
            stroke,
            fill,
            size,
          });
          newElements[index] = newElement;
          return {
            ...state,
            elements: newElements,
          };
        case TOOL_ITEMS.BRUSH:
          newElements[index].points = [
            ...newElements[index].points,
            { x: clientX, y: clientY },
          ];
          return {
            ...state,
            elements: newElements,
          };
        default:
          throw new Error("Type not recognized");
      }
    }
    case BOARD_ACTIONS.DRAW_UP: {
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      
      // Save to database if user is logged in and canvas ID exists
      if (state.isUserLoggedIn && state.canvasId) {
        console.log("Auto-saving canvas after draw up:", { canvasId: state.canvasId, elementsCount: elementsCopy.length });
        updateCanvas(state.canvasId, elementsCopy).catch(error => {
          console.error("Failed to save canvas:", error);
        });
      }

      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      let newElements = [...state.elements];
      newElements = newElements.filter((element) => {
        return !isPointNearElement(element, clientX, clientY);
      });
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      
      // Save to database if user is logged in and canvas ID exists
      if (state.isUserLoggedIn && state.canvasId) {
        console.log("Auto-saving canvas after erase:", { canvasId: state.canvasId, elementsCount: newElements.length });
        updateCanvas(state.canvasId, newElements).catch(error => {
          console.error("Failed to save canvas:", error);
        });
      }
      
      return {
        ...state,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.CHANGE_TEXT: {
      const index = state.elements.length - 1;
      const newElements = [...state.elements];
      newElements[index].text = action.payload.text;
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      
      // Save to database if user is logged in and canvas ID exists
      if (state.isUserLoggedIn && state.canvasId) {
        console.log("Auto-saving canvas after text change:", { canvasId: state.canvasId, elementsCount: newElements.length });
        updateCanvas(state.canvasId, newElements).catch(error => {
          console.error("Failed to save canvas:", error);
        });
      }
      
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      
      // Save to database if user is logged in and canvas ID exists
      if (state.isUserLoggedIn && state.canvasId) {
        updateCanvas(state.canvasId, state.history[state.index - 1]).catch(error => {
          console.error("Failed to save canvas:", error);
        });
      }
      
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
      };
    }
    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      
      // Save to database if user is logged in and canvas ID exists
      if (state.isUserLoggedIn && state.canvasId) {
        updateCanvas(state.canvasId, state.history[state.index + 1]).catch(error => {
          console.error("Failed to save canvas:", error);
        });
      }
      
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.SET_INITIAL_ELEMENTS: {
      return {
        ...state,
        elements: action.payload.elements || [],
        history: [action.payload.elements || []], 
        index: 0,
      };
    }
    case BOARD_ACTIONS.SET_CANVAS_ID:
      return {
        ...state,
        canvasId: action.payload.canvasId,
      };
    case BOARD_ACTIONS.SET_CANVAS_ELEMENTS:
      return {
        ...state,
        elements: action.payload.elements,
      };
    case BOARD_ACTIONS.SET_HISTORY:
      return {
        ...state,
        history: [action.payload.elements],
        index: 0,
      };
    case BOARD_ACTIONS.SET_USER_LOGIN_STATUS:
      return {
        ...state,
        isUserLoggedIn: action.payload.isUserLoggedIn,
      };
    case BOARD_ACTIONS.SAVE_CANVAS:
      // Save to database if user is logged in and canvas ID exists
      if (state.isUserLoggedIn && state.canvasId) {
        updateCanvas(state.canvasId, state.elements).catch(error => {
          console.error("Failed to save canvas:", error);
        });
      }
      return state;
    case BOARD_ACTIONS.CLEAR_CANVAS:
      return {
        ...state,
        elements: [],
        history: [[]],
        index: 0,
      };
    default:
      return state;
  }
};

const isUserLoggedIn = !!localStorage.getItem("whiteboard_user_token");

const initialBoardState = {
  activeToolItem: TOOL_ITEMS.BRUSH,
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
  history: [[]],
  index: 0,
  canvasId: "",
  isUserLoggedIn: isUserLoggedIn,
};

const BoardProvider = ({ children }) => {
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialBoardState
  );

  const changeToolHandler = (tool) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: {
        tool,
      },
    });
  };

  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.ERASING,
        },
      });
      return;
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const boardMouseMoveHandler = (event) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX: event.clientX,
          clientY: event.clientY,
        },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: {
          clientX: event.clientX,
          clientY: event.clientY,
        },
      });
    }
  };

  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING || 
        boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_UP,
      });
      
      // Reset action type to NONE after drawing is complete
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.NONE,
        },
      });
    }
  };

  const textAreaBlurHandler = (text) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: {
        text,
      },
    });
  };

  const boardUndoHandler = useCallback(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.UNDO,
    });
  }, []);

  const boardRedoHandler = useCallback(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.REDO,
    });
  }, []);

  const setCanvasId = (canvasId) => {
    console.log("Setting canvas ID:", canvasId);
    dispatchBoardAction({
      type: BOARD_ACTIONS.SET_CANVAS_ID,
      payload: {
        canvasId,
      },
    });
  };

  const setElements = (elements) => {
    console.log("Setting elements:", elements);
    dispatchBoardAction({
      type: BOARD_ACTIONS.SET_CANVAS_ELEMENTS,
      payload: {
        elements,
      },
    });
  };

  const setHistory = (elements) => {
    console.log("Setting history:", elements);
    dispatchBoardAction({
      type: BOARD_ACTIONS.SET_HISTORY,
      payload: {
        elements,
      },
    });
  };  

  const setUserLoginStatus = (isUserLoggedIn) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.SET_USER_LOGIN_STATUS,
      payload: {
        isUserLoggedIn,
      },
    })
  }

  const saveCanvas = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.SAVE_CANVAS,
    });
  };

  const clearCanvas = () => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CLEAR_CANVAS,
    });
  };

  const loadCanvasElements = async (canvasId) => {
    console.log("loadCanvasElements called with:", canvasId);
    if (canvasId && boardState.isUserLoggedIn) {
      try {
        console.log("Loading canvas elements for:", canvasId);
        const elements = await fetchInitialCanvasElements(canvasId);
        console.log("Loaded elements:", elements);
        dispatchBoardAction({
          type: BOARD_ACTIONS.SET_INITIAL_ELEMENTS,
          payload: { elements },
        });
      } catch (error) {
        console.error("Error loading canvas elements:", error);
        // If loading fails, start with empty canvas
        dispatchBoardAction({
          type: BOARD_ACTIONS.SET_INITIAL_ELEMENTS,
          payload: { elements: [] },
        });
      }
    } else {
      console.log("Not loading canvas elements:", { canvasId, isUserLoggedIn: boardState.isUserLoggedIn });
      // No canvas ID or user not logged in, start with empty canvas
      dispatchBoardAction({
        type: BOARD_ACTIONS.SET_INITIAL_ELEMENTS,
        payload: { elements: [] },
      });
    }
  };

  // Load canvas elements when canvas ID changes
  useEffect(() => {
    console.log("Canvas ID changed to:", boardState.canvasId);
    console.log("User logged in:", boardState.isUserLoggedIn);
    loadCanvasElements(boardState.canvasId);
  }, [boardState.canvasId, boardState.isUserLoggedIn]);

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    elements: boardState.elements,
    toolActionType: boardState.toolActionType,
    canvasId: boardState.canvasId,
    isUserLoggedIn: boardState.isUserLoggedIn,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo: boardUndoHandler,
    redo: boardRedoHandler,
    setCanvasId, 
    setElements,
    setHistory,
    setUserLoginStatus,
    saveCanvas,
    clearCanvas,
    loadCanvasElements
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
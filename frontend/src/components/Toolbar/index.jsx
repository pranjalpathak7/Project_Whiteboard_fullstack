import React, { useContext } from "react";
import classes from "./index.module.css";

import cx from "classnames";
import {
  FaSlash,
  FaRegCircle,
  FaArrowRight,
  FaPaintBrush,
  FaEraser,
  FaUndoAlt,
  FaRedoAlt,
  FaFont,
  FaDownload,
  FaSave,
} from "react-icons/fa";
import { LuRectangleHorizontal } from "react-icons/lu";
import { TOOL_ITEMS } from "../../constants";
import boardContext from "../../store/board-context";

const Toolbar = () => {
  const { activeToolItem, changeToolHandler, undo, redo, saveCanvas, isUserLoggedIn, canvasId, elements } =
    useContext(boardContext);

  const handleDownloadClick = () => {
    const canvas = document.getElementById("canvas");
    const data = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "board.png";
    anchor.click();
  };

  const handleSaveClick = () => {
    if (isUserLoggedIn) {
      saveCanvas();
    } else {
      alert("Please log in to save your canvas");
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.toolItems}>
        <div
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.BRUSH,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.BRUSH)}
        >
          <FaPaintBrush />
        </div>
        <div
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.LINE,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.LINE)}
        >
          <FaSlash />
        </div>
        <div
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.RECTANGLE)}
        >
          <LuRectangleHorizontal />
        </div>
        <div
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.CIRCLE)}
        >
          <FaRegCircle />
        </div>
        <div
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.ARROW,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.ARROW)}
        >
          <FaArrowRight />
        </div>
        <div
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.ERASER,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.ERASER)}
        >
          <FaEraser />
        </div>
        <div
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.TEXT,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.TEXT)}
        >
          <FaFont />
        </div>
      </div>
      <div className={classes.toolItems}>
        <div className={classes.toolItem} onClick={undo}>
          <FaUndoAlt />
        </div>
        <div className={classes.toolItem} onClick={redo}>
          <FaRedoAlt />
        </div>
        <div className={classes.toolItem} onClick={handleDownloadClick}>
          <FaDownload />
        </div>
        <div className={classes.toolItem} onClick={handleSaveClick} title="Save Canvas">
          <FaSave />
        </div>
      </div>
      
      {/* Debug info */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        left: '10px', 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div>Canvas ID: {canvasId || 'None'}</div>
        <div>Elements: {elements.length}</div>
        <div>Logged In: {isUserLoggedIn ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default Toolbar;
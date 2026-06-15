import { useEffect, useRef, useState } from "react";
import axios from "axios";

function App() {

  const wrapperRef = useRef(null);

  const editorRef = useRef(null);

  const intervalRef = useRef(null);

  const [currentSVG, setCurrentSVG] = useState(null);

  const activeTextRef = useRef(null);

  const activeBoxRef = useRef(null);

  const editableTextsRef = useRef([]);

  const isDraggingRef = useRef(false);

  const dragOffsetRef = useRef({
    x: 0,
    y: 0
  });

  // =========================
  // UPLOAD SVG
  // =========================

  const handleUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const svgText = await file.text();

    try {

      await axios.post(
        "http://localhost:5000/api/upload-svg",
        {
          svg: svgText
        }
      );

    } catch (error) {

      console.log(error);

    }

    wrapperRef.current.innerHTML = "";

    wrapperRef.current.insertAdjacentHTML(
      "afterbegin",
      svgText
    );

    const svg =
      wrapperRef.current.querySelector("svg");

    if (!svg) {

      alert("Invalid SVG");

      return;

    }

    svg.style.width = "700px";

    svg.style.maxWidth = "100%";

    svg.style.height = "auto";

    svg.style.display = "block";

    setCurrentSVG(svg);

    initializeEditor(svg);

    // LIVE DB UPDATE
    if (intervalRef.current) {

      clearInterval(intervalRef.current);

    }

   intervalRef.current = setInterval(() => {

  // IF USER STARTED LOCAL EDITING
  // STOP DATABASE FETCH
  if (
    activeTextRef.current ||
    editorRef.current.style.display === "block"
  ) {

    clearInterval(
      intervalRef.current
    );

    console.log(
      "LIVE DB FETCH STOPPED"
    );

    return;

  }

  // FETCH DATABASE SVG
  fetchLatestSVG();

}, 5000);

  };

  // =========================
  // FETCH LATEST SVG
  // =========================

  const fetchLatestSVG = async () => {

    try {

      const response =
        await axios.get(
          "http://localhost:5000/api/latest-svg"
        );

      if (!response.data) return;

      const svgData =
        response.data.currentSvg;

      if (!svgData) return;

      wrapperRef.current.innerHTML = "";

      wrapperRef.current.insertAdjacentHTML(
        "afterbegin",
        svgData
      );

      const svg =
        wrapperRef.current.querySelector("svg");

      if (!svg) return;

      svg.style.width = "700px";

      svg.style.maxWidth = "100%";

      svg.style.height = "auto";

      svg.style.display = "block";

      setCurrentSVG(svg);

      initializeEditor(svg);

      console.log(
        "LIVE DATABASE SVG UPDATED"
      );

    } catch (error) {

      console.log(error);

    }

  };

  // =========================
  // INITIALIZE EDITOR
  // =========================

  const initializeEditor = (svg) => {

    editableTextsRef.current = [];

    const textElements =
      svg.querySelectorAll("text");

    textElements.forEach((text) => {

      editableTextsRef.current.push(text);

      createEditableBox(text);

    });

  };

  // =========================
  // CREATE EDIT BOX
  // =========================

  const createEditableBox = (textElement) => {

    const box = document.createElement("div");

    box.classList.add("text-box");

    wrapperRef.current.appendChild(box);

    updateBox(box, textElement);

    // CLICK
    box.addEventListener("click", () => {

      document
        .querySelectorAll(".text-box")
        .forEach((b) =>
          b.classList.remove("active")
        );

      box.classList.add("active");

      activeTextRef.current =
        textElement;

      activeBoxRef.current =
        box;

    });

    // DOUBLE CLICK
    box.addEventListener("dblclick", () => {

      startEditing(
        textElement,
        box
      );

    });

    // DRAG START
    box.addEventListener(
      "mousedown",
      (e) => {

        isDraggingRef.current = true;

        activeTextRef.current =
          textElement;

        activeBoxRef.current =
          box;

        const x =
          parseFloat(
            textElement.getAttribute("x")
          ) || 0;

        const y =
          parseFloat(
            textElement.getAttribute("y")
          ) || 0;

        dragOffsetRef.current = {

          x: e.clientX - x,

          y: e.clientY - y

        };

      }
    );

  };

  // =========================
  // UPDATE BOX
  // =========================

  const updateBox = (
    box,
    textElement
  ) => {

    try {

      const textRect =
        textElement.getBoundingClientRect();

      const wrapperRect =
        wrapperRef.current.getBoundingClientRect();

      box.style.left =
        (textRect.left - wrapperRect.left) + "px";

      box.style.top =
        (textRect.top - wrapperRect.top) + "px";

      box.style.width =
        Math.max(textRect.width, 40) + "px";

      box.style.height =
        Math.max(textRect.height, 20) + "px";

    } catch (err) {

      console.log(err);

    }

  };

  // =========================
  // START EDITING
  // =========================

  const startEditing = (
    textElement,
    box
  ) => {

    activeTextRef.current =
      textElement;

    activeBoxRef.current =
      box;

    const editor =
      editorRef.current;

    const textRect =
      textElement.getBoundingClientRect();

    const wrapperRect =
      wrapperRef.current.getBoundingClientRect();

    editor.style.display = "block";

    editor.style.left =
      (textRect.left - wrapperRect.left) + "px";

    editor.style.top =
      (textRect.top - wrapperRect.top) + "px";

    editor.style.width =
      Math.max(textRect.width + 20, 120) + "px";

    editor.style.height =
      Math.max(textRect.height + 10, 40) + "px";

    const computed =
      window.getComputedStyle(textElement);

    editor.style.fontSize =
      computed.fontSize;

    editor.style.fontFamily =
      computed.fontFamily;

    editor.style.fontWeight =
      computed.fontWeight;

    editor.style.fontStyle =
      computed.fontStyle;

    editor.style.letterSpacing =
      computed.letterSpacing;

    editor.style.color =
      textElement.getAttribute("fill") || "#000";

    editor.value =
      textElement.textContent.trim();

    editor.focus();

    editor.select();

  };

  // =========================
  // LIVE TEXT UPDATE
  // =========================

  const handleInput = () => {

    if (!activeTextRef.current) return;

    const editor =
      editorRef.current;

    const activeText =
      activeTextRef.current;

    const activeBox =
      activeBoxRef.current;

    // USER IS EDITING
    isDraggingRef.current = true;

    const newText =
      editor.value;

    // HANDLE TSPAN
    const tspans =
      activeText.querySelectorAll("tspan");

    if (tspans.length > 0) {

      const lines =
        newText.split("\n");

      tspans.forEach((tspan, index) => {

        tspan.textContent =
          lines[index] || "";

      });

    } else {

      activeText.textContent =
        newText;

    }

    // KEEP ORIGINAL POSITION
    const originalX =
      activeText.getAttribute("x");

    const originalY =
      activeText.getAttribute("y");

    if (originalX) {

      activeText.setAttribute(
        "x",
        originalX
      );

    }

    if (originalY) {

      activeText.setAttribute(
        "y",
        originalY
      );

    }

    requestAnimationFrame(() => {

      if (activeBox) {

        updateBox(
          activeBox,
          activeText
        );

      }

    });

  };

  // =========================
  // FINISH EDITING
  // =========================

  const finishEditing = () => {

    const editor =
      editorRef.current;

    editor.style.display = "none";

    if (activeBoxRef.current) {

      activeBoxRef.current.classList.remove(
        "active"
      );

    }

    activeTextRef.current = null;

    activeBoxRef.current = null;

    isDraggingRef.current = false;

  };

  // =========================
  // DOWNLOAD SVG
  // =========================

  const downloadSVG = () => {

    if (!currentSVG) {

      alert("Upload SVG First");

      return;

    }

    finishEditing();

    const serializer =
      new XMLSerializer();

    const svgData =
      serializer.serializeToString(
        currentSVG
      );

    const blob =
      new Blob(
        [svgData],
        {
          type: "image/svg+xml"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "edited-svg.svg";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

  };

  // =========================
  // SAVE LOCALLY
  // =========================

  const saveSVG = () => {

    if (!currentSVG) {

      alert("Upload SVG First");

      return;

    }

    finishEditing();

    const serializer =
      new XMLSerializer();

    const svgData =
      serializer.serializeToString(
        currentSVG
      );

    localStorage.setItem(
      "editedSVG",
      svgData
    );

    alert(
      "Edited SVG Saved Locally"
    );

  };

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {

    const handleMouseMove = (e) => {

      if (
        !isDraggingRef.current ||
        !activeTextRef.current
      ) return;

      const activeText =
        activeTextRef.current;

      const activeBox =
        activeBoxRef.current;

      const newX =
        e.clientX -
        dragOffsetRef.current.x;

      const newY =
        e.clientY -
        dragOffsetRef.current.y;

      activeText.setAttribute(
        "x",
        newX
      );

      activeText.setAttribute(
        "y",
        newY
      );

      if (activeBox) {

        updateBox(
          activeBox,
          activeText
        );

      }

    };

    const handleMouseUp = () => {

      isDraggingRef.current = false;

    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp
    );

    return () => {

      if (intervalRef.current) {

        clearInterval(
          intervalRef.current
        );

      }

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );

    };

  }, []);

  return (

    <div
      style={{
        background: "#dcdcdc",
        minHeight: "100vh",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "Arial"
      }}
    >

      <input
        type="file"
        accept=".svg"
        onChange={handleUpload}
        style={{
          marginBottom: "20px"
        }}
      />

      <div>

        <button
          onClick={saveSVG}
          style={buttonStyle}
        >
          Save SVG
        </button>

        <button
          onClick={downloadSVG}
          style={buttonStyle}
        >
          Download SVG
        </button>

      </div>

      <div
        id="svg-wrapper"
        style={{
          position: "relative",
          display: "inline-block"
        }}
      >

        <div ref={wrapperRef} />

        <textarea
          ref={editorRef}
          onInput={handleInput}
          onBlur={finishEditing}
          onKeyDown={(e) => {

            if (e.key === "Enter") {

              e.preventDefault();

              finishEditing();

            }

          }}
          style={{
            position: "absolute",
            display: "none",
            border: "2px solid #2196f3",
            outline: "none",
            resize: "none",
            overflow: "hidden",
            background: "white",
            zIndex: 99999,
            padding: "4px",
            margin: 0,
            minWidth: "100px"
          }}
        />

      </div>

      <style>

        {`

          .text-box{

            position:absolute;

            border:2px dashed #00c853;

            cursor:pointer;

            transition:0.2s;

            z-index:10;

            opacity:0;

            pointer-events:none;

          }

          #svg-wrapper:hover .text-box{

            opacity:1;

            pointer-events:auto;

          }

          .text-box:hover{

            background:rgba(0,200,83,0.08);

          }

          .text-box.active{

            border-color:#2196f3;

            opacity:1;

          }

        `}

      </style>

    </div>

  );

}

const buttonStyle = {

  padding: "10px 18px",

  margin: "10px",

  border: "none",

  background: "#2196f3",

  color: "white",

  borderRadius: "6px",

  cursor: "pointer",

  fontSize: "16px"

};

export default App;
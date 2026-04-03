let selectedFile = null;
let copies = 3;

const fileInput = document.getElementById("fileInput");
const grid = document.getElementById("photoGrid");

fileInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
});

function setCopies(n) {
  copies = n;
}

// LOAD face-api MODEL
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
}

// REMOVE BG
async function removeBackground(file) {
  const formData = new FormData();
  formData.append("image_file", file);

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": REMOVE_BG_API_KEY },
    body: formData
  });

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ADD SKY BLUE BG
function addBackground(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
  });
}

// 🎯 FACE DETECTION + SMART PASSPORT CROP
async function smartCrop(url) {
  const img = new Image();
  img.src = url;

  await loadModels();

  return new Promise((resolve) => {
    img.onload = async () => {

      const detection = await faceapi.detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (!detection) {
        alert("No face detected");
        return;
      }

      const { x, y, width, height } = detection.box;

      // 🔥 PASSPORT RULES
      const cropWidth = width * 2.5;
      const cropHeight = height * 3.2;

      const startX = x - width * 0.75;
      const startY = y - height * 1.2;

      const DPI = 300;
      const finalW = 300;   // 1 inch
      const finalH = 360;   // 1.2 inch

      const canvas = document.createElement("canvas");
      canvas.width = finalW;
      canvas.height = finalH;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        img,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        finalW,
        finalH
      );

      resolve(canvas.toDataURL());
    };
  });
}

// MAIN PROCESS
async function processImage() {
  if (!selectedFile) {
    alert("Upload image first");
    return;
  }

  grid.innerHTML = "";

  try {
    const noBg = await removeBackground(selectedFile);
    const blue = await addBackground(noBg);
    const final = await smartCrop(blue);

    for (let i = 0; i < copies; i++) {
      const div = document.createElement("div");
      div.className = "photo";

      const img = document.createElement("img");
      img.src = final;

      div.appendChild(img);
      grid.appendChild(div);
    }

  } catch (err) {
    console.error(err);
    alert("Error processing image");
  }
}

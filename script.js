let selectedFile = null;

const fileInput = document.getElementById("fileInput");
const photoGrid = document.getElementById("photoGrid");

fileInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
});

// STEP 1: Remove Background
async function removeBackground(file) {
  const formData = new FormData();
  formData.append("image_file", file);

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": REMOVE_BG_API_KEY
    },
    body: formData
  });

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// STEP 2: Add Sky Blue Background
function addBackground(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      // Sky blue background
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL());
    };
  });
}

// STEP 3: Crop Passport Size
function cropPassport(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");

      // Passport ratio 35x45
      const width = 350;
      const height = 450;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL());
    };
  });
}

// MAIN PROCESS
async function processImage() {
  if (!selectedFile) {
    alert("Please upload image");
    return;
  }

  photoGrid.innerHTML = "";

  try {
    // 1 Remove BG
    const bgRemoved = await removeBackground(selectedFile);

    // 2 Add Blue BG
    const blueBg = await addBackground(bgRemoved);

    // 3 Crop
    const finalImage = await cropPassport(blueBg);

    // 4 Add 3 Copies
    for (let i = 0; i < 3; i++) {
      const div = document.createElement("div");
      div.className = "photo";

      const img = document.createElement("img");
      img.src = finalImage;

      div.appendChild(img);
      photoGrid.appendChild(div);
    }

  } catch (err) {
    console.error(err);
    alert("Error processing image");
  }
}

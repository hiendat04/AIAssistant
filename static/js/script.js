window.addEventListener("DOMContentLoaded", () => {
  const recordingButton = document.getElementById("record-button");
  const recordingIcon = recordingButton.querySelector("i");
  const recordingStatus = document.getElementById("record-status");

  const firstNameInput = document.querySelector("#first-name");
  const lastNameInput = document.querySelector("#last-name");
  const usernameInput = document.querySelector("#username");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const birthdayInput = document.querySelector("#birthday");
  const phoneInput = document.querySelector("#phone");
  const citizenshipInput = document.querySelector("#citizenship");
  const addressInput = document.querySelector("#address");
  const addressParts = {
    street: "",
    district: "",
    ward: "",
    city: "",
    province: "",
  };
  let addressEntities = [];

  let isRecording = false;
  let mediaRecorder;
  let audioChunks = [];

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "user_recording.wav");

      recordingStatus.textContent = "✅ Ghi âm xong! Đang xử lý dữ liệu...";

      try {
        const response = await fetch(
          "http://localhost:5000/api/analyze-speech",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        console.log("Response:", data);

        data.forEach((e) => {
          switch (e.entity) {
            case "PERSON":
              const nameArr = e.info.trim().split(" ");
              const firstName = nameArr[nameArr.length - 1];
              const lastName = nameArr.slice(0, nameArr.length - 1).join(" ");
              firstNameInput.value = firstName;
              lastNameInput.value = lastName;
              firstNameInput.classList.add("auto-filled");
              lastNameInput.classList.add("auto-filled");
              break;

            case "EMAIL_ADDRESS":
              emailInput.value = e.info;
              emailInput.classList.add("auto-filled");
              break;

            case "DATE_TIME":
              birthdayInput.value = formatDateForInput(e.info);
              birthdayInput.classList.add("auto-filled");
              break;

            case "VN_PHONE":
              phoneInput.value = e.info;
              phoneInput.classList.add("auto-filled");
              break;

            case "VN_ID":
              citizenshipInput.value = e.info;
              citizenshipInput.classList.add("auto-filled");
              break;

            case "LOCATION":
              addressEntities.push(e.info);
              break;
          }
        });

        if (addressEntities.length != 0) {
          addressEntities.forEach((info) => {
            if (info.includes("Thành Phố")) {
              addressParts.city = info;
            } else if (info.includes("Tỉnh")) {
              addressParts.province = info;
            } else if (info.includes("Quận") || info.includes("Huyện")) {
              addressParts.district = info;
            } else if (info.includes("Phường") || info.includes("Xã")) {
              addressParts.ward = info;
            } else {
              addressParts.street = info;
            }
          });

          console.log(addressParts);

          const formattedAddress = [
            addressParts.street,
            addressParts.ward,
            addressParts.district,
            addressParts.city,
            addressParts.province,
          ]
            .filter((part) => part) // Remove empty info
            .join(", ");

          addressInput.value = formattedAddress;
          addressInput.classList.add("auto-filled");
        }

        recordingStatus.textContent =
          "✅ Tự động điền thành công. Vui lòng kiểm tra lại thông tin!";
      } catch (err) {
        console.error("Lỗi phân tích giọng nói:", err);
        recordingStatus.textContent = "❌ Lỗi khi gửi audio đến server.";
      }
    };

    mediaRecorder.start();
    recordingStatus.textContent = "🎙️ Đang ghi âm...";

    // Change button icon
    recordingIcon.classList.remove("bi-play");
    recordingIcon.classList.add("bi-stop-circle");

    // Reset information in all field.
    firstNameInput.classList?.remove("auto-filled");
    lastNameInput.classList?.remove("auto-filled");
    usernameInput.classList?.remove("auto-filled");
    emailInput.classList?.remove("auto-filled");
    passwordInput.classList?.remove("auto-filled");
    birthdayInput.classList?.remove("auto-filled");
    phoneInput.classList?.remove("auto-filled");
    citizenshipInput.classList?.remove("auto-filled");
    addressInput.classList?.remove("auto-filled");

    firstNameInput.value = "";
    lastNameInput.value = "";
    usernameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";
    birthdayInput.value = "";
    phoneInput.value = "";
    citizenshipInput.value = "";
    addressInput.value = "";

    isRecording = true;
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    recordingIcon.classList.remove("bi-stop-circle");
    recordingIcon.classList.add("bi-play");
    isRecording = false;
  };

  recordingButton.addEventListener("click", () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  recordingIcon.classList.add("bi", "bi-play");

  // Format date helpers
  function formatDateForInput(rawDate) {
    // Check if rawDate is a Vietnamese date string like: "ngày 4 tháng 4 năm 2003"
    const vietnameseDateRegex =
      /(?:(?:ngày)?\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4}))/i;

    const match = rawDate.match(vietnameseDateRegex);
    if (match) {
      const [, day, month, year] = match;
      const formattedDay = day.padStart(2, "0");
      const formattedMonth = month.padStart(2, "0");
      return `${year}-${formattedMonth}-${formattedDay}`; // Format: YYYY-MM-DD
    }

    // If it's a recognizable date like "4/4/2003"
    if (!isNaN(Date.parse(rawDate))) {
      const parsed = new Date(rawDate);
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // If it's in DD/MM/YYYY format
    const parts = rawDate.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // If nothing matched
    return "";
  }
});

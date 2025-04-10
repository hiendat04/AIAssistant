window.addEventListener("DOMContentLoaded", () => {
  // Get button
  const recordingButton = document.getElementById("record-button");
  const recordingIcon = recordingButton.querySelector("i");
  const recordingStatus = document.getElementById("record-status");
  const transcriptionResult = document.getElementById("transcription");

  // Get input fields
  const firstNameInput = document.querySelector("#first-name");
  const lastNameInput = document.querySelector("#last-name");
  const usernameInput = document.querySelector("#username");
  const emailInput = document.querySelector("#email");
  const passwordInputInput = document.querySelector("#password");
  const birthdayInput = document.querySelector("#birthday");
  const phoneInput = document.querySelector("#phone");
  const citizenshipInput = document.querySelector("#citizenship");
  const addressInput = document.querySelector("#address");

  let isRecording = false;
  let fullText = "";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (typeof SpeechRecognition !== "undefined") {
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;

    // Continuous record
    const onResult = (event) => {
      for (const result of event.results) {
        if (result.isFinal) {
          fullText += result[0].transcript + " ";
        }
      }
    };

    const onClick = () => {
      isRecording = !isRecording;
      if (isRecording) {
        fullText = "";
        recognition.start();
        recordingIcon.classList.remove("bi-play");
        recordingIcon.classList.add("bi-stop-circle");
        recordingStatus.textContent = "🎙️ Đang ghi âm...";
      } else {
        recognition.stop();
        recordingIcon.classList.remove("bi-stop-circle");
        recordingIcon.classList.add("bi-play");
        recordingStatus.textContent = "✅ Ghi âm xong! Đang xử lý thông tin...";
      }
    };

    recognition.addEventListener("result", onResult);

    recognition.addEventListener("error", (e) => {
      transcriptionResult.textContent = "❌ Lỗi ghi âm: " + e.error;
      recordingStatus.textContent = "Có lỗi xảy ra";
      recordingIcon.classList.remove("bi-stop-circle");
      recordingIcon.classList.add("bi-play");
      isRecording = false;
    });

    recognition.addEventListener("end", async () => {
      if (isRecording) recognition.start(); // restart for continuous listening
      else {
        console.log(`Transcription: ${fullText}`);

        // Send transcription to back-end for analysis
        const response = await fetch(
          "http://localhost:5000/api/analyze-speech",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ transcription: fullText }),
          }
        );

        // Receive data from back-end
        const data = await response.json();
        console.log(data);
        console.log(JSON.stringify(data));

        // Auto fill
        await data.forEach((e) => {
          switch (e.entity) {
            case "PERSON":
              const nameArr = e.info.trim().split(" ");
              const firstName = nameArr[nameArr.length - 1];
              const lastName = nameArr[0];
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
              if (isValidDateString(e.info)) {
                birthdayInput.value = formatDateForInput(e.info);
                birthdayInput.classList.add("auto-filled");
              }
              break;
            case "VN_PHONE":
              phoneInput.value = e.info;
              phoneInput.classList.add("auto-filled");
              break;
            case "VN_ID":
              citizenshipInput.value = e.info;
              citizenshipInput.classList.add("auto-filled");
              break;
          }
        });

        recordingStatus.textContent =
          "✅Tự động điền thành công. Vui lòng kiểm tra lại thông tin!";
      }
    });

    // Init icon
    recordingIcon.classList.add("bi", "bi-play");
    recordingButton.addEventListener("click", onClick);
  } else {
    // Fallback for unsupported browsers
    recordingButton.remove();
  }

  // Format date
  function formatDateForInput(rawDate) {
    let dateObj;

    if (isNaN(Date.parse(rawDate))) {
      
      // Handle if date is mm/dd/yyyy format
      const parts = rawDate.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return "";
    } else {
      // Parse bằng cách trích thủ công các phần tử
      const parsed = new Date(rawDate);
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }
  }

  function isValidDateString(dateStr) {
    const parsedDate = new Date(dateStr);
    return (
      (!isNaN(parsedDate.getTime()) &&
        /^\d{1,2}[\/\-\s]\d{1,2}[\/\-\s]\d{4}$/.test(dateStr)) ||
      isNaN(Number(dateStr))
    );
  }
  
});

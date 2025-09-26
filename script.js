// --- ส่วนของ Element บนหน้าเว็บ ---
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const statusDiv = document.getElementById('status');
const downloadLink = document.getElementById('downloadLink');

// --- ตัวแปรสำหรับเก็บข้อมูลการเชื่อมต่อ ---
let connection;
let connectionId;

// --- 1. ฟังก์ชันเริ่มต้นการเชื่อมต่อ SignalR ---
async function initializeSignalR() {
    try {
        // *** ถูกต้องแล้ว: เรียก /api/negotiate โดยตรง ***
        const negotiateResponse = await fetch('/api/negotiate');
        const connectionInfo = await negotiateResponse.json();

        // สร้างการเชื่อมต่อ SignalR
        connection = new signalR.HubConnectionBuilder()
            .withUrl(connectionInfo.url)
            .build();
        
        // --- 4. ตั้งค่าการ "ดักฟัง" ข้อความจาก Server ---
        connection.on('summaryComplete', (data) => {
            console.log("Callback received from server:", data);
            statusDiv.innerText = '✅ Summary complete! Your download is ready.';
            
            downloadLink.href = data.url; 
            downloadLink.style.display = 'block'; 
            uploadButton.disabled = false;
        });

        // เริ่มการเชื่อมต่อ
        await connection.start();
        connectionId = connection.connectionId;
        
        console.log("SignalR Connected with ID:", connectionId);
        statusDiv.innerText = "Ready to upload.";

    } catch (error) {
        console.error("SignalR connection failed: ", error);
        statusDiv.innerText = "Error: Could not connect to the real-time server.";
    }
}

// --- 2. ฟังก์ชันจัดการการอัปโหลดไฟล์ ---
uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file first!");
        return;
    }
    if (!connectionId) {
        alert("Cannot connect to the server. Please refresh the page.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('connectionId', connectionId);

    try {
        statusDiv.innerText = 'Uploading file...';
        uploadButton.disabled = true;
        downloadLink.style.display = 'none';

        // *** ถูกต้องแล้ว: เรียก /api/upload โดยตรง ***
        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await uploadResponse.json();

        if (uploadResponse.ok) {
            statusDiv.innerText = `⏳ ${result.message}`; 
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Upload failed: ", error);
        statusDiv.innerText = `Upload Error: ${error.message}`;
        uploadButton.disabled = false; 
    }
});

// --- เริ่มการทำงานทั้งหมดทันทีที่หน้าเว็บโหลดเสร็จ ---
initializeSignalR();
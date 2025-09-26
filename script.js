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
        // ติดต่อ API /api/negotiate เพื่อขอข้อมูลการเชื่อมต่อ
        const negotiateResponse = await fetch('/api/negotiate');
        const connectionInfo = await negotiateResponse.json();

        // สร้างการเชื่อมต่อ SignalR
        connection = new signalR.HubConnectionBuilder()
            .withUrl(connectionInfo.url)
            .build();
        
        // --- 4. ตั้งค่าการ "ดักฟัง" ข้อความจาก Server ---
        // เมื่อ Server ส่งข้อความชื่อ 'summaryComplete' กลับมา ฟังก์ชันนี้จะทำงาน
        connection.on('summaryComplete', (data) => {
            console.log("Callback received from server:", data);
            statusDiv.innerText = '✅ Summary complete! Your download is ready.';
            
            // ตั้งค่าลิงก์และแสดงปุ่มดาวน์โหลด
            downloadLink.href = data.url; 
            downloadLink.style.display = 'block'; 
            
            // เปิดให้ปุ่มอัปโหลดทำงานได้อีกครั้ง
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

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!file) {
        alert("Please select a file first!");
        return;
    }
    if (!connectionId) {
        alert("Cannot connect to the server. Please refresh the page.");
        return;
    }

    // เตรียมข้อมูลที่จะส่งไปใน Request Body (แบบฟอร์ม)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('connectionId', connectionId);

    try {
        // อัปเดตสถานะและปิดปุ่มชั่วคราว
        statusDiv.innerText = 'Uploading file...';
        uploadButton.disabled = true;
        downloadLink.style.display = 'none';

        // --- 3. ส่งไฟล์และ Connection ID ไปที่ API /api/upload ---
        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await uploadResponse.json();

        if (uploadResponse.ok) {
            statusDiv.innerText = `⏳ ${result.message}`; // แสดงข้อความ "Processing..." จาก Server
        } else {
            // หากมี Error จากฝั่ง Server
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Upload failed: ", error);
        statusDiv.innerText = `Upload Error: ${error.message}`;
        uploadButton.disabled = false; // หากล้มเหลว ให้เปิดปุ่มกลับมา
    }
});

// --- เริ่มการทำงานทั้งหมดทันทีที่หน้าเว็บโหลดเสร็จ ---
initializeSignalR();
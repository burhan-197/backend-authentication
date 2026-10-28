export function generateOTP() {
   return Math.floor(100000 + Math.random() * 900000).toString();
}
export function getOtpHtml(otp){
return `<DOCTYPE html>
<html>
<head>
    <title>OTP Verification</title>
</head>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
    }
    h1 {
        color: #333;
    }
    p {
        font-size: 16px;
    }
</style>
<body>
    <h1>Your OTP Code</h1>
    <p>Your OTP code is: <strong>${otp}</strong></p>
    <p>Please use this code to verify your account. This code will expire in 10 minutes.</p>
</body>
</html>`;
}
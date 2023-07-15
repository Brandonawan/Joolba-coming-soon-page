document.addEventListener("DOMContentLoaded", function () {
    // Countdown Timer
    const countdownElement = document.getElementById('countdown');
    const launchDate = new Date('2023-08-01'); // Change to your launch date

    function updateCountdown() {
        const currentDate = new Date();
        const difference = launchDate - currentDate;

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `Launching in: ${days}d ${hours}h ${minutes}m ${seconds}s`;

        if (difference < 0) {
            clearInterval(countdownInterval);
            countdownElement.innerHTML = "App is now live!";
        }
    }

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
});
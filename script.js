document.addEventListener('DOMContentLoaded', () => {
    const datePicker = document.getElementById('date-picker');
    const mealsContainer = document.getElementById('meals-container');
    const totalBookingsEl = document.getElementById('total-bookings');

    // Set the date picker to today's date by default
    const today = new Date();
    datePicker.value = today.toISOString().split('T')[0];

    // Function to fetch and display meals
    const getMeals = (date) => {
        // Format the date to match the Google Sheet header (e.g., "13 Oct, 25")
        const formattedDate = formatDateForSheet(date);
        
        // Replace with your actual Google Apps Script Web App URL
        const webAppUrl = 'YOUR_WEB_APP_URL_HERE'; 
        const requestUrl = `${webAppUrl}?date=${encodeURIComponent(formattedDate)}`;

        // Clear previous meals and show a loading message
        mealsContainer.innerHTML = '<p>Loading...</p>';
        totalBookingsEl.textContent = '...';

        fetch(requestUrl)
            .then(response => response.json())
            .then(data => {
                mealsContainer.innerHTML = ''; // Clear loading message
                if (data.error) {
                    throw new Error(data.error);
                }

                const meals = data.items || [];
                totalBookingsEl.textContent = meals.length;

                if (meals.length > 0) {
                    meals.forEach((meal, index) => {
                        const card = document.createElement('div');
                        card.className = 'card meal-card';
                        
                        const mealContent = document.createElement('p');
                        // The cell number is the index + 2 (since we fetch from row 2)
                        mealContent.textContent = `${index + 2}. ${meal}`; 
                        
                        card.appendChild(mealContent);
                        mealsContainer.appendChild(card);
                    });
                } else {
                    mealsContainer.innerHTML = '<p>No meals scheduled for this date.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                mealsContainer.innerHTML = `<p>Error loading data. Make sure your Web App URL is correct and the script is deployed.</p>`;
                totalBookingsEl.textContent = '0';
            });
    };

    // Helper function to format the date as "d MMM, yy"
    const formatDateForSheet = (dateString) => {
        const date = new Date(dateString);
        // Adjust for timezone offset to prevent date from changing
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        const day = adjustedDate.getDate();
        const month = adjustedDate.toLocaleString('default', { month: 'short' });
        const year = adjustedDate.getFullYear().toString().slice(-2);
        return `${day} ${month}, ${year}`;
    };

    // Initial load
    getMeals(datePicker.value);

    // Listen for date changes
    datePicker.addEventListener('change', (e) => {
        getMeals(e.target.value);
    });
});

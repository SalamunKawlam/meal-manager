document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker');
  const mealsContainer = document.getElementById('meals-container');
  const totalBookingsEl = document.getElementById('total-bookings');
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbwvggiiY5NulKhwm5VOCDlZlftblZrfTNyr-6C5F2TH9x-Zi6OwyI05MTM9UFr3OZje/exec';

  // Set today’s date as default
  const today = new Date();
  datePicker.value = today.toISOString().split('T')[0];

  // Convert ISO date from date picker to "d MMM, yy" (same as Google Sheet)
  const formatDateForSheet = (dateString) => {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month}, ${year}`;
  };

  let allMeals = [];

  // Render filtered meals as cards
  const renderMeals = (meals) => {
    mealsContainer.innerHTML = '';

    if (meals.length === 0) {
      totalBookingsEl.textContent = '0';
      mealsContainer.innerHTML = '<p>No meals scheduled for this date.</p>';
      return;
    }

    totalBookingsEl.textContent = meals.length;

    meals.forEach((meal, index) => {
      const card = document.createElement('div');
      card.className = 'card meal-card';
      const mealContent = document.createElement('p');
      mealContent.innerHTML = `<strong>${index + 1}.</strong> ${meal.name}<br><small>${meal.timestamp}</small>`;
      card.appendChild(mealContent);
      mealsContainer.appendChild(card);
    });
  };

  // Filter by selected date
  const filterMealsByDate = (selectedDate) => {
    const formattedDate = formatDateForSheet(selectedDate);
    console.log('🔎 Filtering for:', formattedDate);

    const filtered = allMeals.filter(meal => meal.mealDate === formattedDate);
    renderMeals(filtered);
  };

  // Fetch all meals data from Apps Script
  const loadAllMeals = () => {
    mealsContainer.innerHTML = '<p>Loading data...</p>';
    totalBookingsEl.textContent = '...';

    fetch(webAppUrl)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        allMeals = data;
        console.log('✅ All data fetched:', allMeals);
        filterMealsByDate(datePicker.value);
      })
      .catch(error => {
        console.error('❌ Error fetching data:', error);
        mealsContainer.innerHTML = '<p>Error loading data. Please check your Web App setup.</p>';
        totalBookingsEl.textContent = '0';
      });
  };

  // Initial load
  loadAllMeals();

  // Listen for date changes
  datePicker.addEventListener('change', (e) => filterMealsByDate(e.target.value));
});
document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker');
  const mealsContainer = document.getElementById('meals-container');
  const totalBookingsEl = document.getElementById('total-bookings');
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbwNaneUpaqOqCnX18UuKvEuj73RjHnILCUUIRXIOe2_pJDo_bW8ppMyDF8q8YO4KKfO/exec';

  const today = new Date();
  datePicker.value = today.toISOString().split('T')[0];

  let allMeals = [];

  // Format readable date/time from timestamp
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} — ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  // Render cards
  const renderMeals = (meals) => {
    mealsContainer.innerHTML = '';

    if (!meals?.length) {
      totalBookingsEl.textContent = '0';
      const noMealsCard = document.createElement('div');
      noMealsCard.className = 'card meal-card'; // Use meal-card class for consistent styling
      noMealsCard.innerHTML = '<p>No meals scheduled for this date.</p>';
      mealsContainer.appendChild(noMealsCard);
      return;
    }

    totalBookingsEl.textContent = meals.length;

    meals.forEach((meal, index) => {
      const card = document.createElement('div');
      card.className = 'card meal-card';

      const serialChip = document.createElement('span');
      serialChip.className = 'serial-chip';
      serialChip.textContent = index + 1;
      card.appendChild(serialChip);

      const mealContent = document.createElement('p');
      const submission = formatDateTime(meal.timestamp);
      mealContent.innerHTML = `
        <strong>${meal.name}</strong><br>
        <small>Submitted on ${submission}</small>
      `;
      card.appendChild(mealContent);

      mealsContainer.appendChild(card);
    });
  };

  // Filter meals by bookingDate (Column D)
  const filterMealsByDate = (selectedDate) => {
    const pickerDate = new Date(selectedDate);

    const filtered = allMeals.filter(meal => {
      if (!meal.bookingDate) return false;
      const bookingDate = new Date(meal.bookingDate);

      // Normalize both to local (Asia/Dhaka)
      const bookingLocal = new Date(bookingDate.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
      const pickerLocal = new Date(pickerDate.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));

      return (
        bookingLocal.getFullYear() === pickerLocal.getFullYear() &&
        bookingLocal.getMonth() === pickerLocal.getMonth() &&
        bookingLocal.getDate() === pickerLocal.getDate()
      );
    });

    console.log("📅 Selected:", selectedDate, "Matched:", filtered.length);
    renderMeals(filtered);
  };

  // Fetch data via JSONP
  const loadAllMeals = () => {
    mealsContainer.innerHTML = '<p>Loading data...</p>';
    totalBookingsEl.textContent = '...';

    const callbackName = 'jsonp_callback_' + Math.round(Math.random() * 100000);

    window[callbackName] = (data) => {
      allMeals = data;
      console.log('✅ Data fetched:', allMeals.length, 'rows');
      filterMealsByDate(datePicker.value);
      document.body.removeChild(script);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `${webAppUrl}?callback=${callbackName}`;
    script.onerror = () => {
      mealsContainer.innerHTML = '<p>Error loading data. Check your Web App deployment.</p>';
      totalBookingsEl.textContent = '0';
    };
    document.body.appendChild(script);
  };

  loadAllMeals();
  datePicker.addEventListener('change', e => filterMealsByDate(e.target.value));
});

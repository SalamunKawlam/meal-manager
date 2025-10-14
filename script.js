document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker');
  const mealsContainer = document.getElementById('meals-container');
  const totalBookingsEl = document.getElementById('total-bookings');
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbzT89kqZQbnadMynPGQEw0NivoylrHNe5e2QR9vrXHJiBgzJ_vf4QfdzaYEEL-JfOM/exec';

  // Default today's date (yyyy-mm-dd)
  const today = new Date();
  datePicker.value = today.toISOString().split('T')[0];

  let allMeals = [];
  let dataLoaded = false;

  // Parse input date safely (works on mobile)
  const parseDate = (value) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Format timestamp (Column A) simply
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Render meals
  const renderMeals = (meals) => {
    mealsContainer.innerHTML = '';

    if (!meals || meals.length === 0) {
      totalBookingsEl.textContent = '0';
      const noMealsCard = document.createElement('div');
      noMealsCard.className = 'card no-meals-card';
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
      mealContent.innerHTML = `
        <strong>${meal.name || ''}</strong><br>
        <small>Submitted: ${formatDateTime(meal.timestamp)}</small>
      `;
      card.appendChild(mealContent);

      mealsContainer.appendChild(card);
    });
  };

  // Filter by bookingDate (Column D)
  const filterMealsByDate = (selectedDate) => {
    if (!dataLoaded) {
      mealsContainer.innerHTML = '';
      const noMealsCard = document.createElement('div');
      noMealsCard.className = 'card no-meals-card';
      noMealsCard.innerHTML = '<p>Loading data...</p><div class="loading-indicator"></div>';
      mealsContainer.appendChild(noMealsCard);
      totalBookingsEl.textContent = '...';
      document.querySelector('.total-bookings-card').style.display = 'none';
      return;
    }

    const picked = parseDate(selectedDate);
    const filtered = allMeals.filter((meal) => {
      if (!meal.bookingDate) return false;
      const bookingDate = new Date(meal.bookingDate);
      return (
        bookingDate.getFullYear() === picked.getFullYear() &&
        bookingDate.getMonth() === picked.getMonth() &&
        bookingDate.getDate() === picked.getDate()
      );
    });

    filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    renderMeals(filtered);
  };

  // Load all data (JSONP)
  const loadAllMeals = () => {
    const noMealsCard = document.createElement('div');
    noMealsCard.className = 'card no-meals-card';
    noMealsCard.innerHTML = '<p>Loading data...</p><div class="loading-indicator"></div>'; // Added loading indicator
    mealsContainer.innerHTML = ''; // Clear previous content
    mealsContainer.appendChild(noMealsCard);
    totalBookingsEl.textContent = '...';
    document.querySelector('.total-bookings-card').style.display = 'none'; // Hide total meals card while loading

    const callbackName = 'jsonp_cb_' + Math.floor(Math.random() * 1e6);

    window[callbackName] = (data) => {
      allMeals = Array.isArray(data) ? data : [];
      dataLoaded = true;
      document.querySelector('.total-bookings-card').style.display = 'block'; // Show total meals card after loading
      renderMeals(allMeals);
      filterMealsByDate(datePicker.value);

      try { document.body.removeChild(script); } catch {}
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `${webAppUrl}?callback=${callbackName}`;
    script.onerror = () => {
      const noMealsCard = document.createElement('div');
      noMealsCard.className = 'card no-meals-card';
      noMealsCard.innerHTML = '<p>Error loading data. Check your Web App deployment.</p>';
      mealsContainer.appendChild(noMealsCard);
      totalBookingsEl.textContent = '0';
      document.querySelector('.total-bookings-card').style.display = 'none'; // Hide total meals card
      delete window[callbackName];
    };
    document.body.appendChild(script);
  };

  // Init
  loadAllMeals();
  datePicker.addEventListener('change', (e) => filterMealsByDate(e.target.value));
});
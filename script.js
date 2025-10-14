document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker');
  const mealsContainer = document.getElementById('meals-container');
  const totalBookingsEl = document.getElementById('total-bookings');
  const webAppUrl =
    'https://script.google.com/macros/s/AKfycbwNaneUpaqOqCnX18UuKvEuj73RjHnILCUUIRXIOe2_pJDo_bW8ppMyDF8q8YO4KKfO/exec';

  // --- Initial setup ---
  const today = new Date();
  datePicker.value = today.toISOString().split('T')[0];

  let allMeals = [];
  let dataLoaded = false;
  let isLoading = false;

  // ---------- Helpers ----------

  // Stable "YYYY-MM-DD" key in Asia/Dhaka
  const getDhakaKey = (date) => {
    const d = new Date(date);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(d);
  };

  // Format readable submission date/time (Column A)
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const dateStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    }).format(d);
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return `${dateStr}, ${timeStr.replace(/([ap])m/i, (m) => m.toUpperCase())}`;
  };

  // ---------- UI helpers ----------

  const showLoading = (message = 'Loading data...') => {
    mealsContainer.innerHTML = `<div class="card no-meals-card"><p>${message}</p></div>`;
    totalBookingsEl.textContent = '...';
  };

  const showError = (message) => {
    mealsContainer.innerHTML = `<div class="card no-meals-card"><p>${message}</p></div>`;
    totalBookingsEl.textContent = '0';
  };

  // ---------- Render ----------

  const renderMeals = (meals) => {
    mealsContainer.innerHTML = '';

    if (!meals?.length) {
      totalBookingsEl.textContent = '0';
      const noMealsCard = document.createElement('div');
      noMealsCard.className = 'card no-meals-card';
      noMealsCard.innerHTML = '<p>No meals scheduled for this date.</p>';
      mealsContainer.appendChild(noMealsCard);
      return;
    }

    totalBookingsEl.textContent = meals.length;

    meals
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .forEach((meal, index) => {
        const card = document.createElement('div');
        card.className = 'card meal-card';

        const chip = document.createElement('span');
        chip.className = 'serial-chip';
        chip.textContent = index + 1;
        card.appendChild(chip);

        const info = document.createElement('p');
        info.innerHTML = `
          <strong>${meal.name || ''}</strong><br>
          <small>Submitted: ${formatDateTime(meal.timestamp)}</small>
        `;
        card.appendChild(info);
        mealsContainer.appendChild(card);
      });
  };

  // ---------- Filtering ----------

  const filterMealsByDate = (selectedDate) => {
    if (!dataLoaded) return showLoading();

    const picked = new Date(selectedDate);
    if (isNaN(picked)) return showError('Invalid date selected.');

    const pickedKey = getDhakaKey(picked);
    const filtered = allMeals.filter((meal) => {
      if (!meal.bookingDate) return false;
      return getDhakaKey(meal.bookingDate) === pickedKey;
    });

    console.log('📅 Selected:', selectedDate, '→', pickedKey, 'Matched:', filtered.length);
    renderMeals(filtered);
  };

  // ---------- Data fetch (JSONP) ----------

  const loadAllMeals = (retry = 0) => {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    const cbName = 'jsonp_cb_' + Math.round(Math.random() * 1e6);

    window[cbName] = (data) => {
      isLoading = false;
      if (!Array.isArray(data)) {
        if (retry < 1) return setTimeout(() => loadAllMeals(retry + 1), 1500);
        return showError('Error loading data. Please check your Web App deployment.');
      }

      allMeals = data;
      dataLoaded = true;
      console.log('✅ Data fetched:', allMeals.length);
      filterMealsByDate(datePicker.value);

      try { document.body.removeChild(script); } catch {}
      delete window[cbName];
    };

    const script = document.createElement('script');
    script.src = `${webAppUrl}?callback=${cbName}`;
    script.onerror = () => {
      isLoading = false;
      if (retry < 1) return setTimeout(() => loadAllMeals(retry + 1), 1500);
      showError('Error loading data. Please check your Web App deployment.');
    };
    document.body.appendChild(script);
  };

  // ---------- Init ----------
  loadAllMeals();
  datePicker.addEventListener('change', (e) => filterMealsByDate(e.target.value));
});

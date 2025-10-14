document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker');
  const mealsContainer = document.getElementById('meals-container');
  const totalBookingsEl = document.getElementById('total-bookings');
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbzT89kqZQbnadMynPGQEw0NivoylrHNe5e2QR9vrXHJiBgzJ_vf4QfdzaYEEL-JfOM/exec';

  // Default to today's date (yyyy-mm-dd)
  const today = new Date();
  datePicker.value = today.toISOString().split('T')[0];

  let allMeals = [];
  let dataLoaded = false;

  // ---------- Helpers ----------

  // Safely parse input date in "YYYY-MM-DD" format
  const parseISODate = (isoString) => {
    const parts = isoString.split('-'); // [yyyy, mm, dd]
    if (parts.length !== 3) return new Date(isoString); // fallback
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day); // local date
  };

  // Convert any date to "YYYY-MM-DD" in Asia/Dhaka timezone
  const getDhakaKey = (date) => {
    const d = new Date(date);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(d); // → "2025-10-14"
  };

  // Format readable submission date+time from timestamp (Column A)
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

  // ---------- Render cards ----------

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

        const serialChip = document.createElement('span');
        serialChip.className = 'serial-chip';
        serialChip.textContent = index + 1;
        card.appendChild(serialChip);

        const mealContent = document.createElement('p');
        const submission = formatDateTime(meal.timestamp);
        mealContent.innerHTML = `
          <strong>${meal.name || ''}</strong><br>
          <small>Submitted: ${submission}</small>
        `;
        card.appendChild(mealContent);

        mealsContainer.appendChild(card);
      });
  };

  // ---------- Filter logic ----------

  const filterMealsByDate = (selectedDate) => {
    if (!dataLoaded) {
      mealsContainer.innerHTML = '<p>Loading data...</p>';
      totalBookingsEl.textContent = '...';
      return;
    }

    // Always parse manually to avoid locale issues on mobile
    const picked = parseISODate(selectedDate);
    if (isNaN(picked)) {
      mealsContainer.innerHTML = '<p>Invalid date selected.</p>';
      totalBookingsEl.textContent = '0';
      return;
    }

    const pickedKey = getDhakaKey(picked);

    const filtered = allMeals.filter((meal) => {
      if (!meal.bookingDate) return false;
      const bookingKey = getDhakaKey(meal.bookingDate);
      return bookingKey === pickedKey;
    });

    console.log('📅 Selected:', selectedDate, '→ Key:', pickedKey, 'Matched:', filtered.length);
    renderMeals(filtered);
  };

  // ---------- Load data from Apps Script (JSONP) ----------

  const loadAllMeals = () => {
    mealsContainer.innerHTML = '<p>Loading data...</p>';
    totalBookingsEl.textContent = '...';

    const callbackName = 'jsonp_cb_' + Math.round(Math.random() * 1e6);

    window[callbackName] = (data) => {
      if (!Array.isArray(data)) {
        mealsContainer.innerHTML = '<p>Invalid data received.</p>';
        totalBookingsEl.textContent = '0';
        return;
      }

      allMeals = data;
      dataLoaded = true;
      console.log('✅ Data fetched:', allMeals.length, 'rows');
      filterMealsByDate(datePicker.value);

      try { document.body.removeChild(script); } catch {}
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `${webAppUrl}?callback=${callbackName}`;
    script.onerror = () => {
      mealsContainer.innerHTML = '<p>Error loading data. Check your Web App deployment.</p>';
      totalBookingsEl.textContent = '0';
      delete window[callbackName];
    };
    document.body.appendChild(script);
  };

  // ---------- Init ----------
  loadAllMeals();
  datePicker.addEventListener('change', (e) => filterMealsByDate(e.target.value));
});

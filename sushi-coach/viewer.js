// Sushi Coach viewer

(function () {
  const byId = (id) => document.getElementById(id);
  const content = byId('content');
  const daySelect = byId('day');

  const images = {
    1: './assets/rice.svg',
    2: './assets/vinegar.svg',
    3: './assets/season.svg',
    4: './assets/fillings.svg',
    5: './assets/roll.svg',
    6: './assets/nigiri.svg',
    7: './assets/serve.svg',
  };

  // Slight variety each load
  const fillingsPool = [
    'Tuna (maguro)', 'Salmon (sake)', 'Yellowtail (hamachi)', 'Shrimp', 'Crab (kani)',
    'Cucumber', 'Avocado', 'Carrot', 'Pickled radish (takuan)', 'Tamago (omelet)',
    'Shiitake', 'Tofu', 'Scallions', 'Spicy mayo', 'Gobo (burdock)'
  ];

  function sample(list, n) {
    const arr = [...list];
    const out = [];
    while (arr.length && out.length < n) {
      const i = Math.floor(Math.random() * arr.length);
      out.push(arr.splice(i, 1)[0]);
    }
    return out;
  }

  const stages = {
    1: () => ({
      title: 'Rinse & Cook Sushi Rice',
      blurb: 'Great sushi starts with properly washed, soaked, and cooked short‑grain rice for ideal texture and sheen.',
      ingredients: [
        'Sushi rice (short‑grain, 2 cups raw)',
        'Water (per your cooker’s ratio; ~2.2 cups)',
      ],
      tools: [ 'Fine mesh strainer', 'Rice cooker or pot + lid', 'Measuring cups' ],
      steps: [
        'Measure 2 cups sushi rice. Place in a bowl and cover with cold water.',
        'Rinse gently, swirling with your fingers until water turns cloudy. Drain. Repeat 4–5× until water runs mostly clear.',
        'Drain well in a fine sieve for 5–10 minutes.',
        'Soak: Add rinsed rice and measured water to cooker (or pot). Let soak 20–30 minutes.',
        'Cook: Start the rice cooker or bring to a simmer in a pot, then cover and cook on low until water is absorbed (about 15–18 minutes).',
        'Rest: Turn off heat and rest covered 10 minutes to finish steaming.',
      ],
      tips: [
        'Do not over‑agitate rice when rinsing: prevents broken grains/starchiness.',
        'If using a pot, avoid peeking during cooking; steam retention matters.',
      ],
      safety: [ 'Handle hot steam carefully when lifting lids.' ],
    }),
    2: () => ({
      title: 'Make Sushi Vinegar (Awase‑zu)',
      blurb: 'A balanced mix of rice vinegar, sugar, and salt adds gloss and delicate seasoning to sushi rice.',
      ingredients: [
        'Rice vinegar (80 ml / ~1/3 cup)',
        'Sugar (30–35 g / ~2.5 tbsp)',
        'Fine salt (8–10 g / ~1.5 tsp)',
        'Optional: kombu square (3–4 cm)',
      ],
      tools: [ 'Small saucepan', 'Spoon/whisk', 'Heat‑proof bowl' ],
      steps: [
        'Combine vinegar, sugar, and salt in a small saucepan.',
        'Warm gently over low heat, stirring until sugar/salt dissolve. Do not boil.',
        'Optional: Steep a kombu square for extra umami; remove before cooling.',
        'Cool to room temp before using.',
      ],
      tips: [
        'Taste and tweak balance: slightly sweet/salty with bright acidity.',
        'Make extra and store sealed in the fridge for 1–2 weeks.',
      ],
      safety: [ 'Keep heat low; boiling drives off aroma and can over‑reduce.' ],
    }),
    3: () => ({
      title: 'Season & Cool the Rice',
      blurb: 'Fold the warm rice with sushi vinegar while fanning to cool for glossy, separate grains.',
      ingredients: [ 'Warm cooked rice (from Day 1)', 'Sushi vinegar (from Day 2)' ],
      tools: [ 'Hangiri (or wide bowl)', 'Shamoji (paddle) or spatula', 'Fan' ],
      steps: [
        'Transfer warm rice to a wide bowl (ideally wood/hangiri).',
        'Sprinkle sushi vinegar evenly over the rice surface (start with ~70% of it).',
        'Use slicing/folding motions to combine without mashing. Fan during mixing for shine.',
        'Taste; add more vinegar to preference. Aim for warm/room‑temp rice, not hot.',
        'Keep covered with a damp towel to prevent drying until use (same day).',
      ],
      tips: [ 'Avoid stirring like risotto: slice/fold to protect grain shape.' ],
      safety: [ 'Keep rice covered and use same day for best food safety and texture.' ],
    }),
    4: () => ({
      title: 'Prep Fillings, Nori, and Tools',
      blurb: 'Prep a tidy mise en place: fillings in uniform batons, dry hands, mat wrapped, and nori ready.',
      ingredients: [
        ...sample(fillingsPool, 5),
        'Nori sheets',
      ],
      tools: [ 'Bamboo mat (makisu) wrapped in plastic', 'Chef’s knife', 'Cutting board', 'Small bowl of water' ],
      steps: [
        'Wrap bamboo mat in plastic to prevent sticking.',
        'Cut fillings into long, even batons or thin slices for neat rolls.',
        'Place nori shiny‑side down on the mat; keep rice and water nearby.',
        'Keep hands lightly damp when handling rice to reduce sticking.',
      ],
      tips: [ 'Uniform sizes ensure tight, symmetrical rolls and clean cross‑sections.' ],
      safety: [ 'Observe raw seafood best‑by dates and keep chilled until use.' ],
    }),
    5: () => ({
      title: 'Roll Maki (Hosomaki / Futomaki)',
      blurb: 'Spread rice evenly, leave a dry border, place fillings, then roll with confident, even pressure.',
      ingredients: [ 'Seasoned rice', 'Nori', 'Today’s fillings' ],
      tools: [ 'Bamboo mat', 'Small bowl of water', 'Sharp knife' ],
      steps: [
        'Place nori shiny‑side down. Wet hands; spread a thin, even layer of rice (~3–5 mm).',
        'Leave ~1.5–2 cm border at the far edge for sealing.',
        'Place fillings in a neat line about 1/3 from the near edge.',
        'Lift mat edge and roll over fillings, tucking to form a cylinder.',
        'Seal edge with a dab of water. Square the roll gently in the mat.',
      ],
      tips: [ 'Use minimal rice for hosomaki (slim rolls); more for futomaki (thick rolls).'],
      safety: [ 'Keep knives dry; wipe between cuts to avoid slipping.' ],
    }),
    6: () => ({
      title: 'Shape Nigiri',
      blurb: 'Form bite‑size rice pads with gentle pressure, add wasabi, and drape sliced fish or toppings.',
      ingredients: [ 'Seasoned rice', 'Sliced fish or toppings', 'Wasabi (optional)' ],
      tools: [ 'Bowl of water + splash of vinegar', 'Clean towel', 'Sharp knife' ],
      steps: [
        'Wet hands lightly. Take ~18–22 g rice; shape into an oval pad with 2–3 light presses.',
        'Add a tiny smear of wasabi (optional).',
        'Place fish/topping over rice; use two fingers to gently shape and adhere.',
        'Aim for compact yet tender—never crushed.',
      ],
      tips: [ 'Keep pieces consistent so they serve neatly and evenly.' ],
      safety: [ 'Raw fish should be sushi‑grade and kept cold until serving.' ],
    }),
    7: () => ({
      title: 'Slice, Plate, and Serve',
      blurb: 'Slice rolls cleanly, arrange with pickles and sauces, and serve rice at room temp for best flavor.',
      ingredients: [ 'Your rolls and nigiri', 'Soy sauce', 'Pickled ginger', 'Wasabi' ],
      tools: [ 'Very sharp knife', 'Damp towel', 'Serving plates' ],
      steps: [
        'Wipe and moisten the knife lightly between cuts for clean slices.',
        'Cut hosomaki into 6–8; futomaki into 8–10, trimming ends if needed.',
        'Arrange attractively. Keep nigiri and rolls separate for visual clarity.',
        'Serve immediately with soy, ginger, and wasabi on the side.',
      ],
      tips: [ 'Room‑temp rice highlights seasoning; avoid refrigeration before serving.' ],
      safety: [ 'Refrigerate leftovers promptly; consume raw fish same day when possible.' ],
    }),
  };

  function getDayFromHash() {
    const m = (location.hash || '').match(/day=(\d)/);
    if (m) return clampDay(parseInt(m[1], 10));
    // Default to today (Mon=1..Sun=7)
    const jsDay = new Date().getDay(); // Sun=0..Sat=6
    const isoDay = jsDay === 0 ? 7 : jsDay;
    return isoDay;
  }

  function clampDay(n) { return Math.min(7, Math.max(1, n|0)); }

  function render(day) {
    day = clampDay(day);
    daySelect.value = String(day);
    const data = stages[day]();
    const img = images[day];

    content.innerHTML = `
      <article class="stage-card">
        <section class="stage-hero">
          <img alt="${escapeHtml(data.title)}" src="${img}" />
          <div>
            <h2>Day ${day} — ${escapeHtml(data.title)}</h2>
            <p>${escapeHtml(data.blurb)}</p>
          </div>
        </section>
        <section class="stage-body">
          <div class="panel">
            <h3>Ingredients</h3>
            <ul>
              ${data.ingredients.map(li).join('')}
            </ul>
          </div>
          <div class="panel">
            <h3>Tools</h3>
            <ul>
              ${data.tools.map(li).join('')}
            </ul>
          </div>
          <div class="panel steps" style="grid-column: 1 / -1;">
            <h3>Steps</h3>
            <ol>
              ${data.steps.map(li).join('')}
            </ol>
          </div>
          <div class="panel">
            <h3>Tips</h3>
            <ul>
              ${data.tips.map(liNote).join('')}
            </ul>
          </div>
          <div class="panel">
            <h3>Safety</h3>
            <ul>
              ${data.safety.map(liWarn).join('')}
            </ul>
          </div>
        </section>
      </article>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function li(s) { return `<li>${escapeHtml(s)}</li>`; }
  function liNote(s) { return `<li class="note">${escapeHtml(s)}</li>`; }
  function liWarn(s) { return `<li class="warn">${escapeHtml(s)}</li>`; }

  function onHashChange() {
    render(getDayFromHash());
  }

  daySelect.addEventListener('change', () => {
    const d = clampDay(parseInt(daySelect.value, 10));
    location.hash = `day=${d}`;
  });

  window.addEventListener('hashchange', onHashChange);
  render(getDayFromHash());
})();


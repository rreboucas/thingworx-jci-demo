/* Mailwave Inbox — list rendering and preview-pane swapping
   The Lodge Inn email is featured at the top and selected on load.
   Clicking decoys swaps in a placeholder body. */
(function () {
  const FEATURED_ID = 'lodge-inn';

  const ROWS = [
    {
      id: FEATURED_ID,
      sender: 'Lodge Inn by the Sea',
      subject: 'Your Suite Upgrade is Confirmed — Welcome, Emily',
      snippet: "As a thank-you for your loyalty we'd be delighted to grant you a complimentary suite upgrade…",
      date: '10:24 AM',
      unread: true,
      starred: true
    },
    {
      id: 'acme-trip',
      sender: 'Acme Travel Co.',
      subject: 'Your trip itinerary is ready',
      snippet: 'Confirmation #TR-558210 · Departure tomorrow 6:42am · Gate B14',
      date: 'Yesterday',
      unread: true
    },
    {
      id: 'chase',
      sender: 'Chase Sapphire',
      subject: 'Statement available — May',
      snippet: 'Your May statement is ready to view in the Chase mobile app or online.',
      date: 'Yesterday'
    },
    {
      id: 'docusign',
      sender: 'DocuSign',
      subject: 'Please review and sign: Stay Agreement',
      snippet: 'Lodge Inn by the Sea sent you an agreement to review and sign before your stay.',
      date: 'May 30',
      unread: true
    },
    {
      id: 'opentable',
      sender: 'OpenTable',
      subject: 'Reservation reminder — The Ivy at 7pm',
      snippet: "Just a friendly reminder of your reservation tomorrow. Reply STOP to opt out.",
      date: 'May 29'
    },
    {
      id: 'pilates',
      sender: 'Pilates Studio NYC',
      subject: 'Your week of bookings',
      snippet: 'Mon 8am Reformer · Wed 7am Mat · Fri 6pm Reformer · See you soon!',
      date: 'May 28'
    },
    {
      id: 'spotify',
      sender: 'Spotify',
      subject: 'Your May Wrapped is here',
      snippet: 'You listened to 312 hours of music in May. Top genre: Indie folk.',
      date: 'May 27'
    },
    {
      id: 'goodreads',
      sender: 'Goodreads',
      subject: 'New release from one of your authors',
      snippet: "Tana French's new mystery is now available — early reviews are calling it her best yet.",
      date: 'May 26'
    },
    {
      id: 'linkedin',
      sender: 'LinkedIn',
      subject: '5 people you may know',
      snippet: 'Ava Patel, Marcus Lin, Priya Desai, and 2 others recently joined your industry.',
      date: 'May 25'
    },
    {
      id: 'apple',
      sender: 'Apple',
      subject: 'Your Apple ID was used to sign in',
      snippet: "Your Apple ID was used to sign in to a new MacBook Pro on May 24, 9:14 PM PDT.",
      date: 'May 24'
    },
    {
      id: 'airbnb',
      sender: 'Airbnb',
      subject: 'Your host left a review',
      snippet: '"Emily was a wonderful guest — communicative, respectful, and welcome back anytime."',
      date: 'May 22'
    },
    {
      id: 'nyt',
      sender: 'The New York Times',
      subject: 'Morning Briefing',
      snippet: "Wednesday: a recap of yesterday's headlines and what to watch today.",
      date: 'May 22'
    },
    {
      id: 'patagonia',
      sender: 'Patagonia',
      subject: 'New arrivals: Summer essentials',
      snippet: 'Lightweight technical fleeces, wide-brim hats, and quick-dry layers — built to last.',
      date: 'May 20'
    },
    {
      id: 'amex',
      sender: 'American Express',
      subject: 'You earned 4,820 Membership Rewards points',
      snippet: 'Your recent purchases have earned 4,820 points. View your account for details.',
      date: 'May 18'
    }
  ];

  function renderRows() {
    const ul = document.getElementById('mw-rows');
    ul.innerHTML = ROWS.map(r => `
      <li class="mw-row ${r.unread ? 'is-unread' : ''} ${r.starred ? 'is-starred' : ''}" data-id="${r.id}">
        <span class="mw-row__check">
          <input type="checkbox" class="mw-checkbox" onclick="event.stopPropagation()" />
        </span>
        <span class="mw-row__star" title="${r.starred ? 'Starred' : 'Star'}" onclick="event.stopPropagation()">
          ${r.starred
            ? '<svg width="16" height="16" viewBox="0 0 20 20"><path d="M10 2l2.5 5.5 6 .5-4.5 4 1.4 6L10 14.8 4.6 18l1.4-6L1.5 8l6-.5L10 2z" fill="#F4B400" stroke="#F4B400"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5.5 6 .5-4.5 4 1.4 6L10 14.8 4.6 18l1.4-6L1.5 8l6-.5L10 2z" stroke="#9aa0a6" stroke-width="1.4" stroke-linejoin="round"/></svg>'}
        </span>
        <span class="mw-row__sender">${escapeHtml(r.sender)}</span>
        <span class="mw-row__content">
          <span class="mw-row__subject">${escapeHtml(r.subject)}</span>
          <span class="mw-row__snippet">— ${escapeHtml(r.snippet)}</span>
        </span>
        <span class="mw-row__date">${escapeHtml(r.date)}</span>
      </li>
    `).join('');

    ul.querySelectorAll('.mw-row').forEach(li => {
      li.addEventListener('click', () => selectRow(li.dataset.id));
    });
  }

  function selectRow(id) {
    document.querySelectorAll('.mw-row').forEach(li => {
      li.classList.toggle('is-selected', li.dataset.id === id);
      if (li.dataset.id === id) li.classList.remove('is-unread');
    });
    renderPreview(id);
  }

  function renderPreview(id) {
    const preview = document.getElementById('mw-preview');
    preview.innerHTML = '';

    if (id === FEATURED_ID) {
      const tpl = document.getElementById('mw-tpl-lodge-inn');
      preview.appendChild(tpl.content.cloneNode(true));
      preview.scrollTop = 0;
      return;
    }

    const row = ROWS.find(r => r.id === id);
    if (!row) return;
    const tpl = document.getElementById('mw-tpl-decoy');
    const node = tpl.content.cloneNode(true);
    node.querySelector('[data-slot="subject"]').textContent = row.subject;
    node.querySelector('[data-slot="from"]').textContent = `From: ${row.sender}  ·  ${row.date}`;
    preview.appendChild(node);
    preview.scrollTop = 0;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderRows();
    selectRow(FEATURED_ID);
  });
})();

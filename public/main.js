document.addEventListener('DOMContentLoaded', function () {
  var confirmForms = document.querySelectorAll('form[data-confirm]');
  Array.prototype.forEach.call(confirmForms, function (form) {
    form.addEventListener('submit', function (event) {
      var message = form.getAttribute('data-confirm') || 'Are you sure?';
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });

  var actionForms = document.querySelectorAll('.gift-actions form');
  Array.prototype.forEach.call(actionForms, function (form) {
    form.addEventListener('submit', function () {
      var button = form.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.classList.add('is-submitting');
      }
    });
  });

  var handleReviewUpdate = function (control, action, giftId) {
    var upBtn = control.querySelector('.gift-review-btn[data-action="up"]');
    var downBtn = control.querySelector('.gift-review-btn[data-action="down"]');
    var buttonsGroup = control.querySelectorAll('.gift-review-btn');

    Array.prototype.forEach.call(buttonsGroup, function (btn) {
      btn.disabled = true;
    });

    fetch('/gifts/review', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: giftId, action: action })
    })
      .then(function (response) {
        if (response.ok) return response.json();
        throw new Error('Request failed');
      })
      .then(function (data) {
        if (!data) return;

        if (upBtn) {
          var upCount = upBtn.querySelector('.gift-review-count');
          if (upCount) upCount.innerText = data.greatBuyCount;
          upBtn.classList.toggle('active', data.rating === 'great');
        }

        if (downBtn) {
          var downCount = downBtn.querySelector('.gift-review-count');
          if (downCount) downCount.innerText = data.dontBuyCount;
          downBtn.classList.toggle('active', data.rating === 'dont');
        }
      })
      .catch(function (err) {
        console.error(err);
      })
      .finally(function () {
        Array.prototype.forEach.call(buttonsGroup, function (btn) {
          btn.disabled = false;
        });
      });
  };

  var reviewControls = document.querySelectorAll('.gift-review-controls');
  Array.prototype.forEach.call(reviewControls, function (control) {
    Array.prototype.forEach.call(control.querySelectorAll('.gift-review-btn'), function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-action');
        var giftId = control.getAttribute('data-id');
        if (!action || !giftId) return;
        handleReviewUpdate(control, action, giftId);
      });
    });
  });

  var resetForms = document.querySelectorAll('.gift-reset-form');
  Array.prototype.forEach.call(resetForms, function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var giftId = form.querySelector('input[name="id"]').value;
      var card = form.closest('.gift-card');
      var reviewControls = card ? card.querySelector('.gift-review-controls') : null;
      var buttonsGroup = reviewControls ? reviewControls.querySelectorAll('.gift-review-btn') : [];

      Array.prototype.forEach.call(buttonsGroup, function (btn) {
        btn.disabled = true;
      });

      fetch('/gifts/reset-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: giftId })
      })
        .then(function (response) {
          if (response.ok) return response.json();
          throw new Error('Request failed');
        })
        .then(function () {
          if (reviewControls) {
            var upBtn = reviewControls.querySelector('.gift-review-btn[data-action="up"]');
            var downBtn = reviewControls.querySelector('.gift-review-btn[data-action="down"]');
            var upCount = upBtn ? upBtn.querySelector('.gift-review-count') : null;
            var downCount = downBtn ? downBtn.querySelector('.gift-review-count') : null;

            if (upCount) upCount.innerText = 0;
            if (downCount) downCount.innerText = 0;
            if (upBtn) upBtn.classList.remove('active');
            if (downBtn) downBtn.classList.remove('active');
          }
        })
        .catch(function (err) {
          console.error(err);
        })
        .finally(function () {
          Array.prototype.forEach.call(buttonsGroup, function (btn) {
            btn.disabled = false;
          });
        });
    });
  });
});

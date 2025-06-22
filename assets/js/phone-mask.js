document.addEventListener('DOMContentLoaded', () => {
    const phoneInputs = document.querySelectorAll('.my-input[name="phone-input"]');

    phoneInputs.forEach(phoneInput => {
        const initialMask = '+7 (';

        phoneInput.addEventListener('focus', () => {
            if (phoneInput.value === initialMask) {
                phoneInput.value = '';
            }
            if (phoneInput.value === '') {
                phoneInput.value = initialMask;
            }
        });

        phoneInput.addEventListener('blur', () => {
            if (phoneInput.value.trim() === '' || phoneInput.value === initialMask) {
                phoneInput.value = '';
            }
        });

        phoneInput.addEventListener('input', (event) => {
            let value = event.target.value.replace(/\D/g, '');
            let formattedValue = '';

            if (value.length > 0) {
                formattedValue = '+7 (' + value.substring(1, 4);
            }
            if (value.length > 4) {
                formattedValue += ') ' + value.substring(4, 7);
            }
            if (value.length > 7) {
                formattedValue += '-' + value.substring(7, 9);
            }
            if (value.length > 9) {
                formattedValue += '-' + value.substring(9, 11);
            }

            event.target.value = formattedValue;
        });
    });
});

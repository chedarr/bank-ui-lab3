class RegistrationPage {
  constructor(page) {
    this.page = page;

    this.email = page.getByLabel('Email', { exact: true });
    this.password = page.getByLabel('Пароль', { exact: true });

    this.confirmPassword = page.getByLabel(
      'Подтверждение пароля',
      { exact: true }
    );

    this.consent = page.getByRole('checkbox', {
      name: 'Принимаю условия регистрации'
    });

    this.submitButton = page.getByRole('button', {
      name: 'Зарегистрироваться',
      exact: true
    });

    this.error = page.getByRole('alert');
    this.success = page.getByRole('status');
  }

  async open() {
    await this.page.goto('/');
  }

  async register({
    email,
    password,
    confirmPassword = password,
    consent = true
  }) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.confirmPassword.fill(confirmPassword);
    await this.consent.setChecked(consent);
    await this.submitButton.click();
  }
}

module.exports = { RegistrationPage };
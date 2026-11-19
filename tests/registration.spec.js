const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');
const { RegistrationPage } = require('../pages/RegistrationPage');

let registration;

function validData(overrides = {}) {
  return {
    email: `client-${randomUUID()}@example.com`,
    password: 'BankTest2026!',
    consent: true,
    ...overrides
  };
}

async function expectSuccess() {
  await expect(registration.success).toHaveText(
    'Регистрация успешно завершена'
  );
  await expect(registration.error).toBeHidden();
}

async function expectError(message) {
  await expect(registration.error).toHaveText(message);
  await expect(registration.success).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  registration = new RegistrationPage(page);
  await registration.open();
});

test('REG-01: успешная регистрация @smoke', async ({ page }) => {
  await page.screenshot({
    path: 'evidence/registration-form.png',
    fullPage: true
  });

  await registration.register(validData());
  await expectSuccess();

  await page.screenshot({
    path: 'evidence/registration-success.png',
    fullPage: true
  });
});

const negativeCases = [
  {
    id: 'REG-02',
    name: 'пустой email',
    data: { email: '' },
    error: 'Введите email'
  },

  {
    id: 'REG-03',
    name: 'email без символа @',
    data: { email: 'student.example.com' },
    error: 'Введите корректный email'
  },

  {
    id: 'REG-04',
    name: 'пароли не совпадают',
    data: { confirmPassword: 'AnotherPassword2026!' },
    error: 'Пароли не совпадают'
  },

  {
    id: 'REG-05',
    name: 'пароль без заглавной буквы',
    data: { password: 'banktest2026!' },
    error: 'Добавьте строчную и заглавную буквы, цифру и спецсимвол'
  },
  
  {
    id: 'REG-06',
    name: 'нет согласия с условиями',
    data: { consent: false },
    error: 'Необходимо принять условия регистрации'
  }
];

for (const scenario of negativeCases) {
  test(`${scenario.id}: ${scenario.name}`, async () => {
    await registration.register(validData(scenario.data));
    await expectError(scenario.error);
  });
}

test('REG-07: повторная регистрация email', async ({ request }) => {
  const data = validData();

  // Подготовка данных внутри этого теста.
  const response = await request.post('/api/register', {
    data: {
      ...data,
      confirmPassword: data.password
    }
  });

  expect(response.status()).toBe(201);

  // Повторная попытка через интерфейс, с другим регистром email.
  await registration.register({
    ...data,
    email: data.email.toUpperCase()
  });

  await expectError('Пользователь с таким email уже существует');
});

test('REG-08: SQL-подобная строка в email', async () => {
  await registration.register(validData({
    email: "' OR 1=1 --"
  }));

  await expectError('Введите корректный email');
});

test('REG-09: XSS-нагрузка в email', async ({ page }) => {
  await registration.register(validData({
    email: '<img src=x onerror="window.__xss=true">'
  }));

  await expectError('Введите корректный email');

  const scriptExecuted = await page.evaluate(() => window.__xss);
  expect(scriptExecuted).toBeUndefined();
});

const boundaries = [
  { id: 'REG-10', length: 11, accepted: false },
  { id: 'REG-11', length: 12, accepted: true },
  { id: 'REG-12', length: 13, accepted: true },
  { id: 'REG-13', length: 63, accepted: true },
  { id: 'REG-14', length: 64, accepted: true },
  { id: 'REG-15', length: 65, accepted: false }
];

for (const boundary of boundaries) {
  test(
    `${boundary.id}: пароль длиной ${boundary.length}`,
    async () => {
      // Сложность соблюдена, изменяется только длина.
      const password = 'Aa1!' + 'x'.repeat(boundary.length - 4);

      await registration.register(validData({ password }));

      if (boundary.accepted) {
        await expectSuccess();
      } else {
        await expectError(
          'Пароль должен содержать от 12 до 64 символов'
        );
      }
    }
  );
}
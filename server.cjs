const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(
  path.join(__dirname, 'app', 'index.html'),
  'utf8'
);

// Учебное хранилище: только зарегистрированные email.
const registeredEmails = new Set();

const emailPattern =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const server = http.createServer(async (req, res) => {
  function send(status, data) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8'
    });
    res.end(JSON.stringify(data));
  }

  if (req.method === 'GET' && req.url === '/background.jpg') {
    try {
      const image = fs.readFileSync(
        path.join(__dirname, 'app', 'background.jpg')
      );

      res.writeHead(200, {
        'Content-Type': 'image/jpeg'
      });

      return res.end(image);
    } catch {
      return send(404, { error: 'Фон не найден' });
    }
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8'
    });

    return res.end(html);
  }


  if (req.method !== 'POST' || req.url !== '/api/register') {
    return send(404, { error: 'Страница не найдена' });
  }

  try {
    let body = '';

    for await (const chunk of req) {
      body += chunk;

      if (Buffer.byteLength(body) > 16384) {
        return send(413, { error: 'Слишком большой запрос' });
      }
    }

    let data;

    try {
      data = JSON.parse(body) || {};
    } catch {
      return send(400, { error: 'Некорректный JSON' });
    }

    const email = typeof data.email === 'string'
      ? data.email.trim().toLowerCase()
      : '';

    const password = typeof data.password === 'string'
      ? data.password
      : '';

    if (!email) {
      return send(400, { error: 'Введите email' });
    }

    if (!emailPattern.test(email)) {
      return send(400, { error: 'Введите корректный email' });
    }

    if (password.length < 12 || password.length > 64) {
      return send(400, {
        error: 'Пароль должен содержать от 12 до 64 символов'
      });
    }

    const strongPassword = [
      /[a-z]/,
      /[A-Z]/,
      /\d/,
      /[!@#$%^&*]/
    ].every(pattern => pattern.test(password));

    if (!strongPassword) {
      return send(400, {
        error: 'Добавьте строчную и заглавную буквы, цифру и спецсимвол'
      });
    }

    if (data.confirmPassword !== password) {
      return send(400, { error: 'Пароли не совпадают' });
    }

    if (data.consent !== true) {
      return send(400, {
        error: 'Необходимо принять условия регистрации'
      });
    }

    if (registeredEmails.has(email)) {
      return send(409, {
        error: 'Пользователь с таким email уже существует'
      });
    }

    registeredEmails.add(email);

    return send(201, { message: 'Регистрация успешно завершена' });
  } catch {
    return send(500, { error: 'Внутренняя ошибка сервера' });
  }
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Учебный стенд: http://127.0.0.1:3000');
});
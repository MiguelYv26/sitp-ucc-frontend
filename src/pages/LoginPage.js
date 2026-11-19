// Página «Login»: el rol se detecta automáticamente con el correo institucional.
import { LOGO } from '../constants/index.js';
import { $app } from '../core/dom.js';
import { api, setToken } from '../services/api.js';

export function LoginPage(onLogin) {
  $app().innerHTML = `
  <main class="login">
    <section class="login-brand">
      <img src="${LOGO}" alt="Universidad Cooperativa de Colombia" class="logo-card">
      <div>
        <p class="eyebrow">Sede Medellín · Ingeniería de Software y Civil</p>
        <h1>Sistema de Trazabilidad de Proyectos de Investigación Formativa</h1>
        <p class="lead">Historial continuo de cada proyecto en los tres cursos, con objetivos, actas, entregables y comentarios compartidos entre el asesor técnico y el asesor metodológico.</p>
      </div>
      <ol class="cursos-list">
        <li><span>1</span>Ideación, Emprendimiento y Desarrollo Tecnológico</li>
        <li><span>2</span>Construcción del Trabajo de Grado</li>
        <li><span>3</span>Aplicación Práctica del Trabajo de Grado</li>
      </ol>
    </section>
    <section class="login-form-wrap">
      <form class="login-form" id="loginForm" novalidate>
        <h2>Bienvenido</h2>
        <p class="muted">Ingresa con tu correo institucional. El rol se detecta automáticamente.</p>
        <label>Correo institucional<input type="email" name="email" autocomplete="username" placeholder="usuario@campusucc.edu.co" required></label>
        <label>Contraseña<input type="password" name="password" autocomplete="current-password" placeholder="••••••••" required></label>
        <p class="form-error" id="loginError" hidden></p>
        <button class="btn block" type="submit">Iniciar sesión</button>
        <p class="fine">Prototipo en entorno de prueba con datos ficticios · Formato E8 · Grupo 04</p>
      </form>
    </section>
  </main>`;
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), err = document.getElementById('loginError'), btn = e.target.querySelector('button');
    err.hidden = true; btn.disabled = true; btn.textContent = 'Verificando…';
    try {
      const { token, user } = await api.login(f.get('email'), f.get('password'));
      setToken(token);
      onLogin(user);
    } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = 'Iniciar sesión'; }
  });
}

import { mount } from 'svelte'
import App from './App.svelte'
import './assets/styles/reset.css'
import './assets/styles/global.css'
import './assets/styles/theme.css'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

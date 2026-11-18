import { esc } from '../utils.js';

export default function StatusBadge(status) {
  return `<span class="status ${esc(status)}">${esc(status)}</span>`;
}

<script setup>
import { authService } from '../services/authService.js';

const emit = defineEmits(['close', 'purchased']);

function pretendPurchase() {
  // Check if user is authenticated
  if (!authService.isUserAuthenticated()) {
    alert('Please sign in with Google to purchase Pro features.');
    return;
  }
  
  // Stub: simulate successful one-time purchase
  localStorage.setItem('pt_ads_removed', '1');
  localStorage.setItem('pt_pro_user', '1');
  
  // Store pro status with user account
  const user = authService.getUser();
  if (user && user.email) {
    localStorage.setItem(`pt_pro_user_${user.email}`, '1');
  }
  
  emit('purchased');
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <h3>Upgrade to Pro</h3>
      <p>One-time fee of <strong>$5</strong> unlocks all Pro features forever for your account.</p>
      <ul>
        <li>Remove all ads permanently</li>
        <li>Unlock advanced typing settings</li>
        <li>Customize themes and appearance</li>
        <li>Save settings across devices</li>
        <li>Enhanced typing experience</li>
      </ul>
      <div class="actions">
        <button class="primary" @click="pretendPurchase">Upgrade to Pro - $5</button>
        <button class="ghost" @click="emit('close')">Cancel</button>
      </div>
    </div>
  </div>
 </template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; width: 420px; }
h3 { margin: 0 0 10px 0; color: var(--font-color); }
p, li { color: var(--gray); }
.actions { display: flex; gap: 10px; margin-top: 15px; }
.primary { background: var(--keyword); color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.ghost { background: transparent; color: var(--font-color); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.primary:hover { background: #6d28d9; }
</style>



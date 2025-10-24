<script setup>
import { computed } from 'vue';

const props = defineProps({
  userFiles: Array, // Accept the new prop for custom files
  fileSystem: Array, // File system data
  tabChallengeStats: Object,
  fileChallengeRegeneration: Object,
  getTabChallengeStats: Function,
  currentCampaign: { type: String, default: 'chimera' }, // Current campaign for project name
});
const emit = defineEmits(['open-file', 'new-file-modal']);

function toggleFolder(event) { 
  event.currentTarget.parentElement.classList.toggle('open'); 
}

function openFile(fileName) { 
  emit('open-file', fileName); 
}

// Get challenge count for a file (including regenerated challenges)
const getFileChallengeCount = computed(() => {
  return (fileName) => {
    const stats = props.getTabChallengeStats ? props.getTabChallengeStats(fileName) : { remaining: 0, total: 0 };
    return stats.remaining;
  };
});

// Get file icon class based on file extension
function getFileIconClass(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  return `file-${extension}`;
}

// Recursive function to render file system items
function renderFileSystemItem(item, indentLevel = 0) {
  if (item.type === 'file') {
    return {
      type: 'file',
      name: item.name,
      indentLevel,
      iconClass: getFileIconClass(item.name),
      challengeCount: getFileChallengeCount.value(item.name)
    };
  } else if (item.type === 'folder') {
    return {
      type: 'folder',
      name: item.name,
      indentLevel,
      isOpen: item.isOpen || false,
      children: item.children ? item.children.map(child => renderFileSystemItem(child, indentLevel + 1)) : []
    };
  }
  return null;
}

// Computed property to process file system data
const processedFileSystem = computed(() => {
  if (!props.fileSystem || !Array.isArray(props.fileSystem)) {
    return [];
  }
  return props.fileSystem.map(item => renderFileSystemItem(item, 0));
});

// Campaign-specific project names
const projectName = computed(() => {
  const names = {
    'chimera': 'CHIMERA_AI',
    'janus': 'NEO_KYOTO',
    'warden': 'ODYSSEY_SHIP',
    'synergy': 'INNOVATE_SOLUTIONS'
  };
  return names[props.currentCampaign] || 'CHIMERA_AI';
});
</script>

<template>
  <div id="sidebar-left">
    <div class="project-header">
      <span>{{ projectName }}</span>
      <button class="new-file-btn" @click="$emit('new-file-modal')" title="Create New File">+</button>
    </div>
    
    <ul class="file-list">
      <template v-for="item in processedFileSystem" :key="item.name">
        <li v-if="item.type === 'folder'" 
            :class="['folder-item', { open: item.isOpen }]" 
            :style="`--indent-level: ${item.indentLevel || 0};`">
          <div class="clickable-area" @click="toggleFolder">
            <span class="folder-icon"></span>
            <span class="folder-name">{{ item.name }}</span>
          </div>
          <ul v-if="item.children && item.children.length > 0" class="nested" :style="`--indent-level: ${(item.indentLevel || 0) + 1};`">
            <template v-for="child in item.children" :key="child.name">
              <!-- Render folders recursively -->
              <li v-if="child.type === 'folder'" 
                  :class="['folder-item', { open: child.isOpen }]" 
                  :style="`--indent-level: ${child.indentLevel || 0};`">
                <div class="clickable-area" @click="toggleFolder">
                  <span class="folder-icon"></span>
                  <span class="folder-name">{{ child.name }}</span>
                </div>
                <ul v-if="child.children && child.children.length > 0" class="nested" :style="`--indent-level: ${(child.indentLevel || 0) + 1};`">
                  <template v-for="grandchild in child.children" :key="grandchild.name">
                    <!-- Render files -->
                    <li v-if="grandchild.type === 'file'" class="file-item">
                      <div class="clickable-area" @click="openFile(grandchild.name)">
                        <span :class="['file-icon', grandchild.iconClass]"></span>
                        <span>{{ grandchild.name }}</span>
                        <span v-if="grandchild.challengeCount > 0" class="challenge-badge">{{ grandchild.challengeCount }}</span>
                      </div>
                    </li>
                    <!-- Render nested folders -->
                    <li v-else-if="grandchild.type === 'folder'" 
                        :class="['folder-item', { open: grandchild.isOpen }]" 
                        :style="`--indent-level: ${grandchild.indentLevel || 0};`">
                      <div class="clickable-area" @click="toggleFolder">
                        <span class="folder-icon"></span>
                        <span class="folder-name">{{ grandchild.name }}</span>
                      </div>
                      <ul v-if="grandchild.children && grandchild.children.length > 0" class="nested" :style="`--indent-level: ${(grandchild.indentLevel || 0) + 1};`">
                        <li v-for="file in grandchild.children" :key="file.name" class="file-item">
                          <div class="clickable-area" @click="openFile(file.name)">
                            <span :class="['file-icon', file.iconClass]"></span>
                            <span>{{ file.name }}</span>
                            <span v-if="file.challengeCount > 0" class="challenge-badge">{{ file.challengeCount }}</span>
                          </div>
                        </li>
                      </ul>
                    </li>
                  </template>
                </ul>
              </li>
              <!-- Render files -->
              <li v-else-if="child.type === 'file'" class="file-item">
                <div class="clickable-area" @click="openFile(child.name)">
                  <span :class="['file-icon', child.iconClass]"></span>
                  <span>{{ child.name }}</span>
                  <span v-if="child.challengeCount > 0" class="challenge-badge">{{ child.challengeCount }}</span>
                </div>
              </li>
            </template>
          </ul>
        </li>
        <!-- Render root-level files -->
        <li v-else-if="item.type === 'file'" class="file-item">
          <div class="clickable-area" @click="openFile(item.name)">
            <span :class="['file-icon', item.iconClass]"></span>
            <span>{{ item.name }}</span>
            <span v-if="item.challengeCount > 0" class="challenge-badge">{{ item.challengeCount }}</span>
          </div>
        </li>
      </template>
      
      <!-- User-created files -->
      <li v-for="file in userFiles" :key="file.name" class="file-item">
        <div class="clickable-area" @click="openFile(file.name)">
          <span :class="['file-icon', 'file-' + file.name.split('.').pop()]"></span>
          <span>{{ file.name }}</span>
          <span v-if="getFileChallengeCount(file.name) > 0" class="challenge-badge">{{ getFileChallengeCount(file.name) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
#sidebar-left { flex-basis: 250px; background-color: var(--sidebar-bg); font-size: 0.85rem; overflow-y: auto; border-right: 1px solid var(--border-color); }
.project-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; font-size: 0.75rem; color: var(--gray); letter-spacing: 1px; }
.new-file-btn { background: none; border: 1px solid var(--gray); color: var(--gray); width: 20px; height: 20px; border-radius: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; line-height: 1; padding-bottom: 2px; }
.new-file-btn:hover { background-color: var(--active-line-bg); color: var(--font-color); }
.file-list { list-style: none; padding: 0; }
.file-list .file-item, .file-list .folder-item { padding: 2px 0; }
.clickable-area { display: flex; align-items: center; cursor: pointer; padding: 4px 10px; padding-left: calc(10px + var(--indent-level, 1) * var(--indent-unit)); }
.folder-item > .clickable-area { padding-left: calc(10px + var(--indent-level, 0) * var(--indent-unit)); }
.clickable-area:hover { background-color: var(--active-line-bg); }
.folder-name { color: var(--parameter); }
.file-list .nested { display: none; padding-left: 0; }
.file-list .open > .nested { display: block; }

/* --- ICON STYLES UPDATED --- */
.folder-icon {
  margin-right: 5px;
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239cdcfe"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z"/></svg>');
}

.open > .clickable-area > .folder-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239cdcfe"><path d="M19 20H5c-1.11 0-2-.9-2-2V6c0-1.1.9-2 2-2h5l2 2h7a2 2 0 0 1 2 2H3v10c0 1.1.9 2 2 2z"/></svg>');
}
/* --- END ICON STYLES --- */

.file-icon { width: 16px; height: 16px; margin-right: 5px; background-size: contain; background-repeat: no-repeat; background-position: center; flex-shrink: 0; }
.file-js { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="10" fill="%23f7df1e"/><text x="25" y="75" font-size="60" font-family="Arial" font-weight="bold" fill="black">JS</text></svg>'); }
.file-vue { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="%2342b883" d="M12 2L2 7l10 12L22 7L12 2zm0 4.2l6.8 4.3L12 16.5l-6.8-6L12 6.2z"/><path fill="%2335495e" d="M12 6.2l-6.8 6L12 16.5V2l10 5l-10-0.8z"/></svg>');}
.file-json { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="10" fill="%23a6a6a6"/><text x="20" y="65" font-size="40" font-family="monospace" fill="black">{ }</text></svg>'); }
.file-md { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%239cdcfe" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>');}
.file-css { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23569cd6"><path d="M3 3h18v2H3V3m0 4h18v2H3V7m0 4h18v2H3v-2m0 4h18v2H3v-2z"/></svg>');}
.file-html { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23E34F26"><path d="M3 3h18v18H3V3m2 2v14h14V5H5m2 2h2l1 2 1-2h2v10h-2V9l-1 2-1-2v8H7V7z"/></svg>');}
.file-git { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23F05032"><path d="M22.3 8.3c-.2-.5-.5-.9-.9-1.2l-5.6-5.6c-.3-.3-.7-.6-1.2-.9C14.1.2 13.5 0 12.8 0h-1.6C10.5 0 10 .2 9.5.6 9.1 1 8.8 1.5 8.6 2c-.2.5-.3 1-.3 1.6s.1 1.1.3 1.6c.2.5.5.9.9 1.2l5.6 5.6c.3.3.7.6 1.2.9.5.2 1 .3 1.6.3s1.1-.1 1.6-.3c.5-.2.9-.5 1.2-.9.4-.3.6-.7.9-1.2.2-.5.3-1 .3-1.6s-.1-1.1-.3-1.6zM18 10c-.6 0-1.1-.2-1.4-.6-.4-.4-.6-.9-.6-1.4s.2-1.1.6-1.4c.4-.4.9-.6 1.4-.6s1.1.2 1.4.6c.4.4.6.9.6 1.4s-.2 1.1-.6 1.4c-.3.4-.8.6-1.4.6zm-3.6 3.6c-.5-.2-.9-.5-1.2-.9-.4-.3-.6-.7-.9-1.2-.2-.5-.3-1-.3-1.6s.1-1.1.3-1.6c.2-.5.5-.9 1.2-1.2l-3.6-3.6C9.6 4.3 8.3 4.1 7.1 4.5 5.9 4.9 5 5.9 4.5 7.1c-.4 1.2-.2 2.5.5 3.6L1.4 14.3c-.4.4-.6.9-.6 1.4s.2 1.1.6 1.4L6 21.7c.4.4.9.6 1.4.6s1.1-.2 1.4-.6l3.6-3.6c1.1.7 2.4.9 3.6.5 1.2-.4 2.2-1.3 2.6-2.5.4-1.2.2-2.5-.5-3.6l-2.1 2.1z"/></svg>');}
.file-svg { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23dcdcaa" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>');}

/* Challenge badge styles */
.challenge-badge {
  background-color: var(--red);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto;
  margin-right: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 1;
}
</style>
import { defineConfig } from 'vite';

function formatAmsterdamBuildTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return `${parts.hour}:${parts.minute}:${parts.second}-${parts.day}/${parts.month}`;
}

const buildTimestamp = formatAmsterdamBuildTimestamp();

export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
  },
});

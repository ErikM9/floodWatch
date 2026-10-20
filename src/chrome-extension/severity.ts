export const severityLevels: Record<number, { colour: string; text: string }> =
  {
    1: { colour: '#FF0000', text: 'severe flooding, danger to life!' },
    2: {
      colour: '#FFA500',
      text: 'flooding is expected, immediate action required!',
    },
    3: { colour: '#218ced', text: 'flooding is possible, be prepared!' },
    4: { colour: '#008000', text: 'Warning no longer in force!' },
  };
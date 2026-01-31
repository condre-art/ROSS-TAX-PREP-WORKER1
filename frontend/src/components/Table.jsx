import React from "react";

export default function Table({ columns, data }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '6px', overflow: 'hidden' }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col} style={{ padding: '12px', background: '#F4F8FB', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #eee' }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} style={{ background: i % 2 ? '#F4F8FB' : '#fff' }}>
            {columns.map(col => (
              <td key={col} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

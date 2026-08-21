function getLuminance(r, g, b) {
    let [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function contrast(hex1, hex2) {
    let rgb1 = hexToRgb(hex1);
    let rgb2 = hexToRgb(hex2);
    let l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    let l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    let lightest = Math.max(l1, l2);
    let darkest = Math.min(l1, l2);
    return (lightest + 0.05) / (darkest + 0.05);
}

const colors = [
    { name: 'f54900 on ffedd4', fg: '#f54900', bg: '#ffedd4', altFg: ['#D64000', '#C23A00', '#B33600', '#A33100', '#942C00'] },
    { name: '6a7282 on 101828', fg: '#6a7282', bg: '#101828', altFg: ['#8791A1', '#9CA3AF', '#99A1AF', '#A8B2C1'] },
    { name: '6a7282 on ffffff', fg: '#6a7282', bg: '#ffffff', altFg: ['#525B6C', '#4B5563', '#374151'] },
    { name: '99a1af on ffffff', fg: '#99a1af', bg: '#ffffff', altFg: ['#6B7280', '#525B6C', '#4B5563'] },
    { name: 'ff7043 on ffffff', fg: '#ff7043', bg: '#ffffff', altFg: ['#E65100', '#D84315', '#BF360C'] },
    { name: 'ffffff on ff793f', fg: '#ffffff', bg: '#ff793f', altBg: ['#E65217', '#D34A0E', '#BF420C'] },
    { name: 'ffffff on 00c950', fg: '#ffffff', bg: '#00c950', altBg: ['#00A341', '#008A37', '#007D32'] },
    { name: 'ffffff on ff7043', fg: '#ffffff', bg: '#ff7043', altBg: ['#E65100', '#D84315', '#BF360C'] },
    { name: '6a7282 on fbeff1', fg: '#6a7282', bg: '#fbeff1', altFg: ['#525B6C', '#4B5563', '#374151'] },
    { name: 'ffffff on F43F5E (rose-500)', fg: '#ffffff', bg: '#F43F5E', altBg: ['#E11D48', '#BE123C'] },
    { name: 'ffffff on F59E0B (amber-500)', fg: '#ffffff', bg: '#F59E0B', altBg: ['#D97706', '#B45309'] },
    { name: 'ffffff on 10B981 (emerald-500)', fg: '#ffffff', bg: '#10B981', altBg: ['#059669', '#047857'] }
];

colors.forEach(c => {
    let curr = contrast(c.fg, c.bg).toFixed(2);
    console.log(c.name + ' | Current: ' + curr);
    if (c.altFg) {
        c.altFg.forEach(alt => console.log('  Alt FG ' + alt + ' -> ' + contrast(alt, c.bg).toFixed(2)));
    }
    if (c.altBg) {
        c.altBg.forEach(alt => console.log('  Alt BG ' + alt + ' -> ' + contrast(c.fg, alt).toFixed(2)));
    }
});

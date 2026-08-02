const date = new Date('2019-01-04');
console.log('ar-SA default:', new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date));
console.log('en-GB default:', new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date));

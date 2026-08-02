const date = new Date('2019-01-04');
console.log('ar-SA:', new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', calendar: 'gregory', numberingSystem: 'arab' }).format(date));
console.log('en-GB:', new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', calendar: 'gregory', numberingSystem: 'latn' }).format(date));

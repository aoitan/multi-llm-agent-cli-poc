export function fillTemplate(template: string, variables: { [key: string]: string }): string {
  let result = template;
  for (const key in variables) {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      const placeholder = `\\$\\{${key}\\}`;
      result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
    }
  }
  return result;
}

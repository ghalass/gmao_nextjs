// app/api/import/utils/convertField.ts
const parseExcelDate = (value: any): Date | null => {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  const excelDateNumber = typeof value === "number" ? value : parseFloat(value);

  if (isNaN(excelDateNumber)) {
    return null;
  }

  const excelEpoch = new Date(1900, 0, 1);
  const daysToAdd = excelDateNumber - (excelDateNumber > 60 ? 2 : 1);

  const resultDate = new Date(
    excelEpoch.getTime() + daysToAdd * 24 * 60 * 60 * 1000
  );

  return isNaN(resultDate.getTime()) ? null : resultDate;
};

export const convertField = (value: any, fieldType: string = "string"): any => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  try {
    switch (fieldType) {
      case "string":
        return String(value).trim();

      case "number":
        const num = parseFloat(value);
        return isNaN(num) ? null : num;

      case "int":
        const int = parseInt(value);
        return isNaN(int) ? null : int;

      case "boolean":
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
          const str = value.toLowerCase().trim();
          return (
            str === "true" ||
            str === "1" ||
            str === "oui" ||
            str === "yes" ||
            str === "vrai"
          );
        }
        return Boolean(value);

      case "date":
        return parseExcelDate(value);

      default:
        return value;
    }
  } catch (error) {
    console.error(
      `Erreur de conversion pour la valeur "${value}" en type "${fieldType}":`,
      error
    );
    return null;
  }
};

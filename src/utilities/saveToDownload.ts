/**
 * Prompts the user to download a file that contains `s`.
 * @param s The string to save in the file
 * @param type The MIME type of the file
 */
export default function saveToDownload(s: string, type = "text/plain"): void {
    const objectURL = window.URL.createObjectURL(new Blob([s], { type }));

    window.location.href = objectURL;
    window.URL.revokeObjectURL(objectURL);
}

// Возвращает дату в формате YYYY-MM-DD hh:mm:ss
if (!Date.prototype.toLString) {
  (function () {
    function pad(number) {
      if (number < 10) {
        return "0" + number;
      }
      return number;
    }

    Date.prototype.toLString = function () {
      return (
        this.getFullYear() +
        "-" +
        pad(this.getMonth() + 1) +
        "-" +
        pad(this.getDate()) +
        " " +
        pad(this.getHours()) +
        ":" +
        pad(this.getMinutes()) +
        ":" +
        pad(this.getSeconds())
      );
    };
  })();
}

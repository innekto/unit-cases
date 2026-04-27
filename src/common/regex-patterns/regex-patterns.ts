const emailRegex = /^(?!.*\s)(?=.{6,320}$)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const passwordRegex =
  /^(?!.*[А-Яа-яЁёЇїЄєҐґІі])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])^[^\s"'=;-]*$/;

const userNameRegex =
  /^(?!.*[!@#\$%^&*_+\-=~?]{2,})[A-Za-z0-9А-Яа-яҐЄІЇґєії!@#\$%^&*_+\-=~?]{4,20}$/i;

const taskTitleRegex = /^[A-Za-zА-Яа-яЇїІіЄєҐґ0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/;

export { emailRegex, passwordRegex, taskTitleRegex, userNameRegex };

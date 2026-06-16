
export class ProgressDisplay {

  constructor(options: { container: HTMLElement; upperMessage: string; lowerMessage: string; }) {
    const progressNotification = document.createElement('div');
    progressNotification.classList.add('notification-with-progress');
    progressNotification.innerHTML = `
      <div class="upper-message">
        ${options.upperMessage}
      </div>
      <div class="circular-progress">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" class="progress-ring" width="120" height="120">
          <circle class="progress-ring__backing-circle" viewBox="0 0 120 120" stroke-width="10" fill="transparent" r="50" cx="60" cy="60"/>
          <circle class="progress-ring__circle" viewBox="0 0 120 120" stroke-width="10" fill="transparent" r="50" cx="60" cy="60"/>
        </svg>
        <div class="progress-value">0%</div>
      </div>
      <div class="lower-message">
        ${options.lowerMessage}
      </div>
  `;

    const circle = progressNotification.querySelector('.progress-ring__circle') as Element;

    //@ts-ignore
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (1 / 8 * circumference);

    //@ts-ignore
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    //@ts-ignore
    circle.style.strokeDashoffset = offset;
    //@ts-ignore
    circle.style.stroke = '#4caf50'; // Progress color


    //@ts-ignore
    progressNotification.querySelector('.progress-value').textContent = `waiting...`;
    options.container.appendChild(progressNotification);
  }
}

export class PopupMessage {

  constructor(options: { container: HTMLElement; upperMessage: string; lowerMessage: string; returnContainer: HTMLElement }) {
    const progressNotification = document.createElement('div');
    progressNotification.classList.add('notification-with-progress');
    progressNotification.innerHTML = `
      <div class="upper-message">
        ${options.upperMessage}
      </div>
      <div class="lower-message">
        ${options.lowerMessage}
      </div>

  `;

    progressNotification.appendChild(options.returnContainer);

    options.container.appendChild(progressNotification);
  }
}

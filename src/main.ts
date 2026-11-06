import "./style.css";
import { TRANSCRIPTIONS } from "./transcriptions";

const convertMillisecondsToTimeString = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millisecondsPart = milliseconds % 1000;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  const formattedMilliseconds = String(millisecondsPart).padStart(3, "0");

  return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
};

const createTranscriptionElement = (transcription: {
  content: string;
  begin: number;
  end: number;
}) => {
  const element = document.createElement("div");
  element.className = "transcription";
  const progress = document.createElement("progress");
  progress.className = "transcription-progress";
  progress.max = transcription.end - transcription.begin;
  progress.value = 0;
  const content = document.createElement("div");
  content.className = "transcription-text";
  content.textContent = transcription.content;
  const time = document.createElement("div");
  time.className = "transcription-time";
  time.textContent = `${convertMillisecondsToTimeString(transcription.begin)} - ${convertMillisecondsToTimeString(transcription.end)}`;
  element.appendChild(progress);
  element.appendChild(content);
  element.appendChild(time);
  return element;
};

class TimerApp {
  private app: HTMLDivElement;
  private timerElement: HTMLDivElement;
  private timer: Date | null = null;
  private intervalId: number | null = null;
  private pauseTime: Date | null = null;
  private transcriptionsContainer: HTMLDivElement;
  private currentTranscriptionIndex: number = 0;

  constructor() {
    const app = document.getElementById("app");
    if (!app) {
      throw new Error("App element not found");
    }
    this.app = app as HTMLDivElement;

    const timerElement = app.querySelector("#timer-time");
    if (!timerElement) {
      throw new Error("Timer element not found");
    }
    this.timerElement = timerElement as HTMLDivElement;

    app
      .querySelector<HTMLButtonElement>("#timer-button-0sec")!
      .addEventListener("click", () => this.startTimer(0));
    app
      .querySelector<HTMLButtonElement>("#timer-button-3sec")!
      .addEventListener("click", () => this.startTimer(-3));
    app
      .querySelector<HTMLButtonElement>("#timer-button-5sec")!
      .addEventListener("click", () => this.startTimer(-5));
    app
      .querySelector<HTMLButtonElement>("#timer-button-pause")!
      .addEventListener("click", () => this.pauseTimer());
    app
      .querySelector<HTMLButtonElement>("#timer-button-resume")!
      .addEventListener("click", () => this.resumeTimer());

    this.transcriptionsContainer = app.querySelector(
      "#transcriptions",
    )! as HTMLDivElement;
    if (!this.transcriptionsContainer) {
      throw new Error("Transcriptions container not found");
    }

    this.transcriptionsContainer.innerHTML = "";
    this.transcriptionsContainer.append(
      ...TRANSCRIPTIONS.map(createTranscriptionElement),
    );
  }

  private updateTimerDisplay() {
    if (this.timer) {
      // カウンター更新
      const currentTime = new Date();
      const elapsedTime = Math.abs(
        currentTime.getTime() - this.timer.getTime(),
      );
      const isNegative = currentTime < this.timer;

      this.timerElement.style.color = isNegative
        ? "var(--red-color)"
        : "var(--text)";
      this.timerElement.textContent =
        convertMillisecondsToTimeString(elapsedTime);

      // トランスクリプションの進捗更新
      if (!isNegative) {
        if (this.currentTranscriptionIndex < TRANSCRIPTIONS.length) {
          const currentTranscription =
            TRANSCRIPTIONS[this.currentTranscriptionIndex];
          const progressElement = this.transcriptionsContainer.children[
            this.currentTranscriptionIndex
          ].querySelector("progress") as HTMLProgressElement;

          if (elapsedTime >= currentTranscription.begin) {
            const progressValue = Math.min(
              elapsedTime - currentTranscription.begin,
              currentTranscription.end - currentTranscription.begin,
            );
            progressElement.value = progressValue;

            if (elapsedTime >= currentTranscription.end) {
              this.currentTranscriptionIndex++;
            }
          }

          // フォーカスする
          if (this.currentTranscriptionIndex < TRANSCRIPTIONS.length) {
            const currentTranscriptionElement = this.transcriptionsContainer
              .children[this.currentTranscriptionIndex] as HTMLDivElement;
            currentTranscriptionElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }
    }
  }

  private progressReset() {
    for (let i = 0; i < this.transcriptionsContainer.children.length; i++) {
      const progressElement = this.transcriptionsContainer.children[
        i
      ].querySelector("progress") as HTMLProgressElement;
      progressElement.value = 0;
    }
  }

  public startTimer(countdownSeconds: number = 0) {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    this.pauseTime = null;
    this.app.querySelector<HTMLButtonElement>(
      "#timer-button-pause",
    )!.style.display = "inline-block";
    this.app.querySelector<HTMLButtonElement>(
      "#timer-button-resume",
    )!.style.display = "none";
    this.currentTranscriptionIndex = 0;
    this.progressReset();
    this.timer = new Date(Date.now() - countdownSeconds * 1000);
    this.intervalId = window.setInterval(this.updateTimerDisplay.bind(this), 1);
  }

  public pauseTimer() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.pauseTime = new Date();

      this.app.querySelector<HTMLButtonElement>(
        "#timer-button-pause",
      )!.style.display = "none";
      this.app.querySelector<HTMLButtonElement>(
        "#timer-button-resume",
      )!.style.display = "inline-block";
    }
  }

  public resumeTimer() {
    if (this.pauseTime && this.timer) {
      const pausedDuration = new Date().getTime() - this.pauseTime.getTime();
      this.timer = new Date(this.timer.getTime() + pausedDuration);
      this.pauseTime = null;
      this.intervalId = window.setInterval(
        this.updateTimerDisplay.bind(this),
        1,
      );

      this.app.querySelector<HTMLButtonElement>(
        "#timer-button-pause",
      )!.style.display = "inline-block";
      this.app.querySelector<HTMLButtonElement>(
        "#timer-button-resume",
      )!.style.display = "none";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TimerApp();
});

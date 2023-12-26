import { Component           } from '@angular/core';
import { DiskInfo, HanoiStep } from 'src/app/_models/log-info.model';
//
@Component({
  selector: 'app-games-hanoi',
  templateUrl: './game-hanoi.component.html',
  styleUrls: ['./game-hanoi.component.css']
})
//
export class HanoiTowersComponent {
  //
  public    towerA              : Map<number,( DiskInfo | undefined)> = new Map<number,( DiskInfo | undefined)>();
  public    towerB              : Map<number,( DiskInfo | undefined)> = new Map<number,( DiskInfo | undefined)>();
  public    towerC              : Map<number,( DiskInfo | undefined)> = new Map<number,( DiskInfo | undefined)>();
  protected steps               : string[]       = [];
  protected _steps              : HanoiStep[]    = [];
  protected _stepsIndex         : number     = 0;
  protected _startGame          : boolean    = true;
  private   delayInMilliseconds : number     = 1500;
  protected _stepsAmt           : number     = 0;
  protected N                   : number     = 4;

  //
  constructor(){
      //
  }
  //
  printSteps()
  {
    // END RECURSION
    if (this._stepsIndex > this._stepsAmt)
    {
      return;
    }
    //
    if (this._stepsIndex == 0)
      this.steps.push("[BEGIN STEPS]");
    //
    if (this._steps[this._stepsIndex])
    {
      let hanoiStep   : HanoiStep = this._steps[this._stepsIndex];
      let n           : number    = hanoiStep.n;
      let from        : string    = hanoiStep.from;
      let to          : string    = hanoiStep.to;
      //
      let message : string = `Step ${(this._stepsIndex + 1)} of ${this._stepsAmt}. Move disk ${n} from Tower ${from} to Tower ${to}`;
      // 
      this.steps.push(message);
      // 
      this.makeMove(hanoiStep);
    }
    //    
    this._stepsIndex++;
    //
    if ((this._stepsIndex) == this._stepsAmt)
    {
      this.steps.push("[END STEPS]");
    }
    //
    setTimeout(() => {
      this.printSteps();
    }, this.delayInMilliseconds); // Delay each move by 1 second        
  }
  //
  makeMove(hanoiStep: HanoiStep) {
    let _n           : number = hanoiStep.n;
    let _from        : string = hanoiStep.from;
    let _to          : string = hanoiStep.to;
    //    
    let diskInfo    : DiskInfo | undefined = undefined;
    // 
    switch (_from) {
        case 'A':
          diskInfo = this.towerA.get(_n);
          this.towerA.set(_n, new DiskInfo(_n,"-"));
          break;
        case 'B':
          diskInfo = this.towerB.get(_n);
          this.towerB.set(_n, new DiskInfo(_n,"-"));
          break;
        case 'C':
          diskInfo = this.towerC.get(_n);
          this.towerC.set(_n, new DiskInfo(_n,"-"));
          break;
    }
    //
    switch (_to) {
      case 'A':
        this.towerA.set(_n,diskInfo);
        break;
      case 'B':
        this.towerB.set(_n,diskInfo);
        break;
      case 'C':
        this.towerC.set(_n,diskInfo);
        break;
    };
  }
  //
  saveStep(n: number, from: string, to: string) {
    // Implement logic to move a single disk from 'from' tower to 'to' tower
    let hanoiStep : HanoiStep = new HanoiStep(n,from,to);
    //
    this._steps.push(hanoiStep);
    //
    this._stepsAmt++;
  }
  //
  towerOfHanoi(n : number, from_rod : string, to_rod : string, aux_rod : string ):void
  {
      if (n === 0) {
        return;
      }
      this.towerOfHanoi(n - 1, from_rod, aux_rod, to_rod);
      this.saveStep(n,from_rod,to_rod);
      this.towerOfHanoi(n - 1, aux_rod, to_rod, from_rod);
  }
  //
  newGame():void {
    //
    console.log("[HANOI TOWERS] - [NEW GAME]")
    //
    this.towerA      =  new Map<number,( DiskInfo | undefined)>();
    let  graph      : string = "";
    for (let i= 1; i <= this.N; i++) {
      graph = graph + "*";
      this.towerA.set(i,new DiskInfo(i,graph));
    }  
    //
    this.towerB    =  new Map<number,( DiskInfo | undefined)>();
    for (let i= 1; i <= this.N; i++) {
      this.towerB.set(i,new DiskInfo(i,"-"));
    }  
    //
    this.towerC    =  new Map<number,( DiskInfo | undefined)>();
    for (let i= 1; i <= this.N; i++) {
      this.towerC.set(i,new DiskInfo(i,"-"));
    }  
    //
    this.steps        = [];
    this._steps       = [];
    this._stepsIndex  = 0;
    this._stepsAmt    = 0;
    //
    this._startGame  = false;
  }
  //  
  startGame():void {
    //
    console.log("[HANOI TOWERS] - [START GAME]")
    //
    this._startGame = true;
		// A, B and C are names of rods
    this.towerOfHanoi(this.N, 'A', 'C', 'B');
    //
    this.printSteps();
  }
}

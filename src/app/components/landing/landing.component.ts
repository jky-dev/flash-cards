import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from 'src/app/services/crud.service';
import { Observer, Subscription, Subject } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {
  observer: Observer<boolean>;
  sub: Subscription;
  ready: boolean;
  constructor(private crud: CrudService) {
    console.log('constructing');
    crud.initialize();
  }

  ngOnInit() {
    console.log('OnInit');
    this.ready = this.crud.getIsReady();
    this.sub = this.crud.getIsReadyObserver().subscribe(x => {
      this.ready = x;
      console.log(x ? 'Ready to go' : 'Not ready');
    });
  }

  ngOnDestroy() {
    console.log('Unsubbing');
    this.sub.unsubscribe();
  }

}

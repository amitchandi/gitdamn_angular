import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import {
  RepoAccess,
  Repository,
  RepositoryService,
} from "services/repository.service";
import { ActivatedRoute } from "@angular/router";
import { TableModule } from "primeng/table";
import { DropdownModule } from "primeng/dropdown";
import { DividerModule } from "primeng/divider";
import { CardModule } from "primeng/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MenuComponent } from "../menu/menu.component";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    MatProgressSpinnerModule,
    FormsModule,
    DialogModule,
    TableModule,
    DropdownModule,
    DividerModule,
    CardModule,
    MenuComponent,
  ],
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
})
export class SettingsComponent {
  isLoaded = false;
  username: string = "";
  repositoryName: string = "";
  newName: string = "";
  deleteVisible: boolean = false;
  changeVisibilityOpen: boolean = false;
  targetUsername!: string;

  repositoryInfo!: Repository;
  userPermissions: RepoAccess[] = [];

  permissions: string[] = ["read", "write"];

  clonedProducts: { [s: string]: any } = {};

  validateNewName_Timeout!: any;
  isRenameButtonValid = false;

  addUserModalVisible = false;
  addUserSearchtext = "";

  constructor(
    private repositoryService: RepositoryService,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.username = this.route.snapshot.params["username"];
    this.repositoryName = this.route.snapshot.params["reponame"];

    this.newName = this.repositoryName.replace(".git", "");

    this.repositoryInfo = await this.repositoryService.getRepositoryInfo(
      this.username,
      this.repositoryName,
    );
    this.userPermissions = [...this.repositoryInfo.accessList];

    this.isLoaded = true;
  }

  async validateNewName() {
    if (this.validateNewName_Timeout)
      clearTimeout(this.validateNewName_Timeout);
    this.validateNewName_Timeout = setTimeout(async () => {
      const newName = this.newName.includes(".git")
        ? this.newName
        : this.newName + ".git";
      const repoInfo = await this.repositoryService.getRepositoryInfo(
        this.username,
        newName,
      );
      if (repoInfo) {
        // red check mark
        console.log(newName + " - red");
        this.isRenameButtonValid = false;
      } else {
        // green check mark
        console.log(newName + " - green");
        this.isRenameButtonValid = true;
      }
    }, 1000 * 3);
  }

  async rename() {
    await this.repositoryService.changeRepositoryName(
      this.username,
      this.repositoryName,
      this.newName,
    );
    const old_pathname = `${this.username}/${this.repositoryName}`;
    const new_pathname = `${this.username}/${this.newName}.git`;
    window.location.pathname = window.location.pathname.replace(
      old_pathname,
      new_pathname,
    );
  }

  async changeVisibility() {
    await this.repositoryService.changeRepositoryVisibility(
      this.username,
      this.repositoryName,
    );
    window.location.reload();
  }

  async changeOwnership() {
    await this.repositoryService.changeRepositoryOwnership(
      this.username,
      this.repositoryName,
      this.targetUsername,
    );
  }

  toggleChangeVisibilityDialog() {
    this.changeVisibilityOpen = !this.changeVisibilityOpen;
  }

  toggleDeleteDialog() {
    this.deleteVisible = !this.deleteVisible;
  }

  onRowEditInit(acessList: any) {
    this.clonedProducts[acessList.username as string] = { ...acessList };
  }

  async onRowEditSave(product: any) {
    if (product.price > 0) {
      delete this.clonedProducts[product.username as string];
      // this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Product is updated' });
    } else {
      // this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Price' });
    }
    console.log(product);
    await this.repositoryService.changeUserPermissionInAccessList(
      this.username,
      this.repositoryName,
      product,
    );
  }

  onRowEditCancel(product: any, index: number) {
    this.repositoryInfo.accessList[index] =
      this.clonedProducts[product.username as string];
    delete this.clonedProducts[product.username as string];
  }

  openAddUserDialog() {
    this.addUserSearchtext = "";
    this.addUserModalVisible = true;
  }

  addUserToAccessList() {
    this.addUserSearchtext = "";
    this.addUserModalVisible = false;
  }

  async deleteUserFromAccessList(repoAccess: RepoAccess) {
    const success = await this.repositoryService.deleteUserFromAccessList(
      this.username,
      this.repositoryName,
      repoAccess,
    );
    console.log(success);
    //TODO needs to reload
  }

  validateUsernameOrEmail() {
    this.addUserSearchtext; // TODO check that this username/email exists
  }
}
